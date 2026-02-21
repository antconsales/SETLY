/**
 * Model Manager for SETLY AI Assistant
 *
 * Handles the full lifecycle of the on-device LLM:
 * - Download GGUF model with progress tracking via expo-file-system
 * - Cache in documentDirectory/models/
 * - Init/release LlamaContext from llama.rn
 * - State machine: not_downloaded → downloading → downloaded → loading → ready → error
 */

import { File, Directory, Paths } from 'expo-file-system';
import {
  createDownloadResumable,
  type DownloadResumable,
} from 'expo-file-system/legacy';
import { initLlama, releaseAllLlama, type LlamaContext } from 'llama.rn';

// --- Model configuration ---

const MODEL_FILENAME = 'setly-ai.gguf';
const MODEL_DIR_NAME = 'models';

/**
 * Default model URL — functionary-small-v3.2 Q4_K_M GGUF.
 * Small enough for mobile (~200 MB), supports function calling.
 */
const DEFAULT_MODEL_URL =
  'https://huggingface.co/meetkai/functionary-small-v3.2-GGUF/resolve/main/functionary-small-v3.2.Q4_K_M.gguf';

// --- Types ---

export type ModelState =
  | 'not_downloaded'
  | 'downloading'
  | 'downloaded'
  | 'loading'
  | 'ready'
  | 'error';

export interface ModelStatus {
  state: ModelState;
  progress: number; // 0–100
  error?: string;
  fileSizeBytes?: number;
}

export type ModelStatusListener = (status: ModelStatus) => void;

// --- LlamaContext init params (tuned for mobile) ---

const CONTEXT_PARAMS = {
  n_ctx: 2048,
  n_batch: 512,
  n_threads: 4,
  n_gpu_layers: 0, // CPU-only for broad device support
  use_mlock: false,
  use_mmap: true,
} as const;

// --- Model Manager ---

class ModelManager {
  private status: ModelStatus = { state: 'not_downloaded', progress: 0 };
  private listeners: Set<ModelStatusListener> = new Set();
  private context: LlamaContext | null = null;
  private activeDownload: DownloadResumable | null = null;
  private modelUrl: string = DEFAULT_MODEL_URL;

  // --- Paths ---

  private get modelDir(): Directory {
    return new Directory(Paths.document, MODEL_DIR_NAME);
  }

  private get modelFile(): File {
    return new File(Paths.document, MODEL_DIR_NAME, MODEL_FILENAME);
  }

  // --- Status management ---

  getStatus(): ModelStatus {
    return { ...this.status };
  }

  subscribe(listener: ModelStatusListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(update: Partial<ModelStatus>) {
    this.status = { ...this.status, ...update };
    this.listeners.forEach((fn) => fn(this.getStatus()));
  }

  // --- Check if model file exists on disk ---

  checkModelExists(): boolean {
    try {
      const file = this.modelFile;
      if (file.exists) {
        this.setStatus({
          state: 'downloaded',
          progress: 100,
          fileSizeBytes: file.size,
          error: undefined,
        });
        return true;
      }
    } catch (error) {
      console.error('[ModelManager] checkModelExists error:', error);
    }
    this.setStatus({ state: 'not_downloaded', progress: 0 });
    return false;
  }

  // --- Download ---

  async download(url?: string): Promise<void> {
    if (this.status.state === 'downloading') return;
    if (this.status.state === 'ready' || this.status.state === 'downloaded') {
      if (this.checkModelExists()) return;
    }

    this.modelUrl = url || DEFAULT_MODEL_URL;
    this.setStatus({ state: 'downloading', progress: 0, error: undefined });

    try {
      // Ensure model directory exists
      const dir = this.modelDir;
      if (!dir.exists) {
        dir.create({ intermediates: true });
      }

      // Use legacy createDownloadResumable for progress tracking
      const file = this.modelFile;
      this.activeDownload = createDownloadResumable(
        this.modelUrl,
        file.uri,
        {},
        (data) => {
          const progress =
            data.totalBytesExpectedToWrite > 0
              ? Math.round(
                  (data.totalBytesWritten / data.totalBytesExpectedToWrite) *
                    100
                )
              : 0;
          this.setStatus({ progress });
        }
      );

      const result = await this.activeDownload.downloadAsync();
      this.activeDownload = null;

      if (result && result.status === 200) {
        this.setStatus({
          state: 'downloaded',
          progress: 100,
          fileSizeBytes: file.exists ? file.size : undefined,
        });
      } else {
        throw new Error(
          `Download fallito: status ${result?.status ?? 'unknown'}`
        );
      }
    } catch (error) {
      this.activeDownload = null;
      const message =
        error instanceof Error ? error.message : 'Errore download sconosciuto';
      this.setStatus({ state: 'error', progress: 0, error: message });
      console.error('[ModelManager] download error:', error);
    }
  }

  async cancelDownload(): Promise<void> {
    if (this.activeDownload) {
      try {
        await this.activeDownload.pauseAsync();
      } catch {
        // ignore pause errors
      }
      this.activeDownload = null;
    }
    // Clean up partial file
    try {
      const file = this.modelFile;
      if (file.exists) {
        file.delete();
      }
    } catch {
      // ignore cleanup errors
    }
    this.setStatus({ state: 'not_downloaded', progress: 0, error: undefined });
  }

  // --- Init LlamaContext ---

  async initContext(): Promise<LlamaContext> {
    if (this.context) return this.context;

    if (this.status.state !== 'downloaded' && this.status.state !== 'ready') {
      if (!this.checkModelExists()) {
        throw new Error('Modello non scaricato');
      }
    }

    this.setStatus({ state: 'loading', progress: 100, error: undefined });

    try {
      const file = this.modelFile;
      this.context = await initLlama(
        { model: file.uri, ...CONTEXT_PARAMS },
        (progress) => {
          this.setStatus({ state: 'loading', progress });
        }
      );

      this.setStatus({ state: 'ready', progress: 100 });
      return this.context;
    } catch (error) {
      this.context = null;
      const message =
        error instanceof Error ? error.message : 'Errore caricamento modello';
      this.setStatus({ state: 'error', progress: 0, error: message });
      console.error('[ModelManager] initContext error:', error);
      throw error;
    }
  }

  // --- Release context ---

  async releaseContext(): Promise<void> {
    if (this.context) {
      try {
        await this.context.release();
      } catch (error) {
        console.error('[ModelManager] releaseContext error:', error);
      }
      this.context = null;
    }

    if (!this.checkModelExists()) {
      this.setStatus({ state: 'not_downloaded', progress: 0 });
    }
  }

  // --- Get current context (null if not loaded) ---

  getContext(): LlamaContext | null {
    return this.context;
  }

  // --- Delete model file from disk ---

  async deleteModel(): Promise<void> {
    await this.releaseContext();

    try {
      const file = this.modelFile;
      if (file.exists) {
        file.delete();
      }
    } catch (error) {
      console.error('[ModelManager] deleteModel error:', error);
    }

    this.setStatus({
      state: 'not_downloaded',
      progress: 0,
      fileSizeBytes: undefined,
      error: undefined,
    });
  }

  // --- Full cleanup ---

  async dispose(): Promise<void> {
    await this.cancelDownload();
    try {
      await releaseAllLlama();
    } catch {
      // ignore
    }
    this.context = null;
    this.listeners.clear();
    this.setStatus({ state: 'not_downloaded', progress: 0 });
  }
}

// Singleton export
export const modelManager = new ModelManager();

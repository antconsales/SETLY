import { create } from 'zustand';
import { db } from '@/db/client';
import { workoutTemplates, templateExercises, exercises } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface TemplateExerciseWithDetails {
  id: number;
  exerciseId: number;
  exerciseName: string;
  category: string | null;
  orderIndex: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeight: number | null;
}

export interface TemplateWithExercises {
  id: number;
  name: string;
  description: string | null;
  isDefault: boolean | null;
  exercises: TemplateExerciseWithDetails[];
}

interface TemplateState {
  templates: TemplateWithExercises[];
  isLoading: boolean;
  error: string | null;

  fetchTemplates: () => Promise<void>;
  getTemplate: (id: number) => TemplateWithExercises | undefined;
  createTemplate: (
    name: string,
    description: string,
    exercises: { exerciseId: number; targetSets?: number; targetReps?: number; targetWeight?: number }[]
  ) => Promise<number | null>;
  deleteTemplate: (id: number) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set, get) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });

    try {
      // Fetch all templates
      const templatesData = await db.select().from(workoutTemplates);

      // Fetch exercises for each template
      const templatesWithExercises: TemplateWithExercises[] = [];

      for (const template of templatesData) {
        const templateExercisesData = await db
          .select({
            id: templateExercises.id,
            exerciseId: templateExercises.exerciseId,
            orderIndex: templateExercises.orderIndex,
            targetSets: templateExercises.targetSets,
            targetReps: templateExercises.targetReps,
            targetWeight: templateExercises.targetWeight,
            exerciseName: exercises.name,
            category: exercises.category,
          })
          .from(templateExercises)
          .innerJoin(exercises, eq(templateExercises.exerciseId, exercises.id))
          .where(eq(templateExercises.templateId, template.id))
          .orderBy(templateExercises.orderIndex);

        templatesWithExercises.push({
          id: template.id,
          name: template.name,
          description: template.description,
          isDefault: template.isDefault,
          exercises: templateExercisesData.map((e) => ({
            id: e.id,
            exerciseId: e.exerciseId!,
            exerciseName: e.exerciseName,
            category: e.category,
            orderIndex: e.orderIndex,
            targetSets: e.targetSets,
            targetReps: e.targetReps,
            targetWeight: e.targetWeight,
          })),
        });
      }

      set({ templates: templatesWithExercises, isLoading: false });
    } catch (error) {
      console.error('Error fetching templates:', error);
      set({ error: 'Failed to load templates', isLoading: false });
    }
  },

  getTemplate: (id) => {
    return get().templates.find((t) => t.id === id);
  },

  createTemplate: async (name, description, exercisesList) => {
    try {
      // Insert template
      const [template] = await db
        .insert(workoutTemplates)
        .values({
          name,
          description,
          isDefault: false,
        })
        .returning();

      // Insert exercises
      if (exercisesList.length > 0) {
        await db.insert(templateExercises).values(
          exercisesList.map((e, index) => ({
            templateId: template.id,
            exerciseId: e.exerciseId,
            orderIndex: index,
            targetSets: e.targetSets || 4,
            targetReps: e.targetReps,
            targetWeight: e.targetWeight,
          }))
        );
      }

      // Refresh templates
      await get().fetchTemplates();

      return template.id;
    } catch (error) {
      console.error('Error creating template:', error);
      return null;
    }
  },

  deleteTemplate: async (id) => {
    try {
      // Delete exercises first (foreign key)
      await db.delete(templateExercises).where(eq(templateExercises.templateId, id));
      // Delete template
      await db.delete(workoutTemplates).where(eq(workoutTemplates.id, id));
      // Refresh
      await get().fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  },
}));

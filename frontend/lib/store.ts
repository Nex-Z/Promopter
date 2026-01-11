import { create } from "zustand";
import {
    type Prompt,
    type Category,
    type Tag,
    type Version,
    getPrompts,
    createPrompt,
    updatePrompt,
    updatePromptCategory,
    deletePrompt,
    getCategories,
    createCategory,
    getTags,
    createTag,
    createVersion,
    getVersions,
    toggleVersionStar as dbToggleVersionStar,
    renameVersion as dbRenameVersion,
} from "@/lib/db";

interface PromptState {
    // Data
    prompts: Prompt[];
    categories: Category[];
    tags: Tag[];
    versions: Version[];

    // UI State
    activePromptId: number | null;
    isLoading: boolean;
    error: string | null;
    showVersionPanel: boolean;
    compareVersionIds: [number | null, number | null];

    // Actions
    loadData: () => Promise<void>;
    selectPrompt: (id: number | null) => void;
    createNewPrompt: (title: string, categoryId?: number | null) => Promise<number>;
    savePrompt: (id: number, title: string, content: string, createVersionSnapshot?: boolean) => Promise<void>;
    movePrompt: (id: number, categoryId: number | null) => Promise<void>;
    duplicatePrompt: (id: number) => Promise<number>;
    copyPromptTo: (id: number, categoryId: number | null, newTitle: string) => Promise<number>;
    removePrompt: (id: number, hard?: boolean) => Promise<void>;
    addCategory: (name: string, parentId?: number | null) => Promise<number>;
    addTag: (name: string, color?: string) => Promise<number>;

    // Version actions
    loadVersions: (promptId: number) => Promise<void>;
    createVersionSnapshot: (promptId: number, content: string, name?: string) => Promise<number>;
    restoreVersion: (versionId: number) => Promise<void>;
    toggleVersionPanel: () => void;
    setCompareVersions: (ids: [number | null, number | null]) => void;
    toggleVersionStar: (versionId: number) => Promise<void>;
    renameVersionName: (versionId: number, name: string) => Promise<void>;
}

export const usePromptStore = create<PromptState>((set, get) => ({
    // Initial state
    prompts: [],
    categories: [],
    tags: [],
    versions: [],
    activePromptId: null,
    isLoading: false,
    error: null,
    showVersionPanel: false,
    compareVersionIds: [null, null],

    // Load all data from database
    loadData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [prompts, categories, tags] = await Promise.all([
                getPrompts(),
                getCategories(),
                getTags(),
            ]);
            set({ prompts, categories, tags, isLoading: false });
        } catch (error) {
            set({ error: String(error), isLoading: false });
        }
    },

    // Select active prompt
    selectPrompt: (id) => {
        set({ activePromptId: id, versions: [], showVersionPanel: false });
    },

    // Create new prompt (category is optional)
    createNewPrompt: async (title, categoryId = null) => {
        try {
            const id = await createPrompt(title, "", categoryId);
            const prompts = await getPrompts();
            set({ prompts, activePromptId: id });
            return id;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Save prompt with optional version snapshot
    savePrompt: async (id, title, content, createVersionSnapshot = true) => {
        try {
            // Get current content for version comparison
            const currentPrompt = get().prompts.find(p => p.id === id);

            await updatePrompt(id, title, content);

            // Auto-create version if content changed significantly
            if (createVersionSnapshot && currentPrompt && currentPrompt.content !== content) {
                const versionCount = (await getVersions(id)).length;
                await createVersion(id, content, `v${versionCount + 1}`);
            }

            const prompts = await getPrompts();
            set({ prompts });

            // Reload versions if panel is open
            if (get().showVersionPanel) {
                const versions = await getVersions(id);
                set({ versions });
            }
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Move prompt to different category
    movePrompt: async (id, categoryId) => {
        try {
            await updatePromptCategory(id, categoryId);
            const prompts = await getPrompts();
            set({ prompts });
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Duplicate prompt
    duplicatePrompt: async (id) => {
        try {
            const prompt = get().prompts.find(p => p.id === id);
            if (!prompt) throw new Error("Prompt not found");

            const newId = await createPrompt(
                `${prompt.title} (副本)`,
                prompt.content,
                prompt.category_id
            );
            const prompts = await getPrompts();
            set({ prompts, activePromptId: newId });
            return newId;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Copy prompt to another category with specified title
    copyPromptTo: async (id, categoryId, newTitle) => {
        try {
            const prompt = get().prompts.find(p => p.id === id);
            if (!prompt) throw new Error("Prompt not found");

            const newId = await createPrompt(newTitle, prompt.content, categoryId);
            const prompts = await getPrompts();
            set({ prompts, activePromptId: newId });
            return newId;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Delete prompt
    removePrompt: async (id, hard = false) => {
        try {
            await deletePrompt(id, hard);
            const prompts = await getPrompts();
            const { activePromptId } = get();
            set({
                prompts,
                activePromptId: activePromptId === id ? null : activePromptId,
            });
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Add category
    addCategory: async (name, parentId = null) => {
        try {
            const id = await createCategory(name, parentId);
            const categories = await getCategories();
            set({ categories });
            return id;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Add tag
    addTag: async (name, color = "#F97316") => {
        try {
            const id = await createTag(name, color);
            const tags = await getTags();
            set({ tags });
            return id;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Load versions for a prompt
    loadVersions: async (promptId) => {
        try {
            const versions = await getVersions(promptId);
            set({ versions });
        } catch (error) {
            set({ error: String(error) });
        }
    },

    // Create manual version snapshot
    createVersionSnapshot: async (promptId, content, name) => {
        try {
            const versionCount = get().versions.length;
            const versionName = name || `v${versionCount + 1}`;
            const id = await createVersion(promptId, content, versionName);
            const versions = await getVersions(promptId);
            set({ versions });
            return id;
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Restore prompt to a specific version
    restoreVersion: async (versionId) => {
        try {
            const { versions, activePromptId, prompts } = get();
            const version = versions.find(v => v.id === versionId);
            if (!version || !activePromptId) return;

            const prompt = prompts.find(p => p.id === activePromptId);
            if (!prompt) return;

            // Save current as a version before restoring
            await createVersion(activePromptId, prompt.content, `恢复前备份`);

            // Update prompt with version content
            await updatePrompt(activePromptId, prompt.title, version.content);

            const updatedPrompts = await getPrompts();
            const updatedVersions = await getVersions(activePromptId);
            set({ prompts: updatedPrompts, versions: updatedVersions });
        } catch (error) {
            set({ error: String(error) });
            throw error;
        }
    },

    // Toggle version panel visibility
    toggleVersionPanel: () => {
        const { showVersionPanel, activePromptId } = get();
        if (!showVersionPanel && activePromptId) {
            // Opening panel - load versions
            get().loadVersions(activePromptId);
        } else {
            // Closing panel - reset compare state
            set({ compareVersionIds: [null, null] });
        }
        set({ showVersionPanel: !showVersionPanel });
    },

    // Set versions to compare
    setCompareVersions: (ids) => {
        set({ compareVersionIds: ids });
    },

    // Toggle star on a version
    toggleVersionStar: async (versionId) => {
        const { versions } = get();
        const version = versions.find(v => v.id === versionId);
        if (!version) return;

        const newStarred = version.is_starred === 0;
        await dbToggleVersionStar(versionId, newStarred);

        // Update local state
        set({
            versions: versions.map(v =>
                v.id === versionId ? { ...v, is_starred: newStarred ? 1 : 0 } : v
            )
        });
    },

    // Rename a version
    renameVersionName: async (versionId, name) => {
        const { versions } = get();
        await dbRenameVersion(versionId, name);

        // Update local state
        set({
            versions: versions.map(v =>
                v.id === versionId ? { ...v, version_name: name || null } : v
            )
        });
    },
}));

// Selectors
export const useActivePrompt = () => {
    const { prompts, activePromptId } = usePromptStore();
    return prompts.find((p) => p.id === activePromptId) ?? null;
};

export const usePromptsByCategory = (categoryId: number | null) => {
    const { prompts } = usePromptStore();
    return prompts.filter((p) => p.category_id === categoryId);
};

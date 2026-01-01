<template>
  <Popover>
    <PopoverTrigger as-child>
      <Button variant="outline" size="sm" class="w-[200px] justify-between">
        <span class="truncate">{{ currentBranch || "No branch" }}</span>
        <ChevronDown
          class="ml-2 h-4 w-4 shrink-0 opacity-50"
          :stroke-width="1"
        />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-[200px] p-0" align="start">
      <div
        class="max-h-[300px] overflow-y-auto bg-white mt-1 rounded-md shadow-md"
      >
        <div class="p-2">
          <input
            v-model="searchQuery"
            placeholder="Find a branch..."
            class="w-full px-2 py-1 text-sm border rounded"
          />
        </div>
        <div class="border-t">
          <button
            v-for="branch in filteredBranches"
            :key="branch"
            @click="switchBranch(branch)"
            :class="[
              'w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors flex items-center justify-between',
              branch === currentBranch ? 'bg-accent' : '',
            ]"
          >
            <span class="truncate">{{ branch }}</span>
            <Check
              v-if="branch === currentBranch"
              class="w-4 h-4 shrink-0"
              :stroke-width="1"
            />
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ChevronDown, Check } from "lucide-vue-next";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/Popover";
import Button from "../ui/Button.vue";
import { useRepositoryStore } from "../../stores/repository.store";

const repositoryStore = useRepositoryStore();
const searchQuery = ref("");
const branches = ref<string[]>([]);
const currentBranch = ref<string>("");

const currentRepository = computed(() => repositoryStore.currentRepository);

const filteredBranches = computed(() => {
  if (!searchQuery.value) return branches.value;
  return branches.value.filter((branch) =>
    branch.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const loadBranches = async () => {
  if (!currentRepository.value) return;

  try {
    const result = await window.api.git.getBranches(
      currentRepository.value.path
    );
    branches.value = result.local;
    currentBranch.value = result.current;
  } catch (error) {
    console.error("Failed to load branches:", error);
  }
};

const switchBranch = async (branch: string) => {
  if (!currentRepository.value || branch === currentBranch.value) return;

  try {
    await window.api.git.checkout(currentRepository.value.path, branch);
    currentBranch.value = branch;
    await repositoryStore.fetchGitStatus();
  } catch (error) {
    console.error("Failed to switch branch:", error);
  }
};

onMounted(() => {
  loadBranches();
});
</script>

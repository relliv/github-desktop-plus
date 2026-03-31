<template>
  <aside class="relative flex flex-col h-full w-full overflow-hidden">
    <!-- Header -->
    <div class="px-4 pt-3 pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Sparkles class="w-4 h-4 text-primary" :stroke-width="1.5" />
          <h3 class="font-semibold text-sm">AI Chat</h3>
        </div>
        <button
          @click="appStore.toggleAiPanel()"
          class="p-1 hover:bg-accent rounded transition-colors"
          title="Close panel"
        >
          <X class="w-3.5 h-3.5" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Messages area -->
    <div class="flex-1 overflow-y-auto px-4 py-2" v-lenis>
      <div
        v-if="messages.length === 0"
        class="flex flex-col items-center justify-center h-full text-muted-foreground gap-3"
      >
        <Sparkles class="w-8 h-8 opacity-30" :stroke-width="1" />
        <p class="text-sm text-center">
          Ask questions about your repository, get help with code, or generate
          commit messages.
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="[
            'text-sm rounded-lg px-3 py-2 max-w-[90%]',
            msg.role === 'user'
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-accent',
          ]"
        >
          {{ msg.content }}
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="p-3 border-t border-border/50">
      <div class="relative">
        <textarea
          ref="inputRef"
          v-model="inputText"
          placeholder="Ask about your code..."
          rows="1"
          class="w-full bg-accent/50 text-sm pl-3 pr-9 py-2 rounded-lg outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground resize-none"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button
          @click="sendMessage"
          :disabled="!inputText.trim()"
          class="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors disabled:opacity-30"
        >
          <SendHorizonal
            class="w-3.5 h-3.5"
            :stroke-width="1.5"
          />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Sparkles, X, SendHorizonal } from "lucide-vue-next";
import { useAppStore } from "@/stores/app.store";

const appStore = useAppStore();

interface Message {
  role: "user" | "assistant";
  content: string;
}

const messages = ref<Message[]>([]);
const inputText = ref("");
const inputRef = ref<HTMLTextAreaElement | null>(null);

const sendMessage = () => {
  const text = inputText.value.trim();
  if (!text) return;
  messages.value.push({ role: "user", content: text });
  inputText.value = "";

  // Placeholder response — will be replaced with real AI integration
  setTimeout(() => {
    messages.value.push({
      role: "assistant",
      content: "AI integration coming soon. This is a placeholder response.",
    });
  }, 500);
};
</script>

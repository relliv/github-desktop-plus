<template>
  <aside class="relative flex h-full w-full flex-col overflow-hidden">
    <!-- Header -->
    <div class="px-4 pt-3 pb-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Sparkles class="text-primary h-4 w-4" :stroke-width="1.5" />
          <h3 class="text-sm font-semibold">AI Chat</h3>
        </div>
        <button
          @click="appStore.toggleAiPanel()"
          class="hover:bg-accent rounded p-1 transition-colors"
          title="Close panel"
        >
          <X class="h-3.5 w-3.5" :stroke-width="1.5" />
        </button>
      </div>
    </div>

    <!-- Messages area -->
    <div class="flex-1 overflow-y-auto px-4 py-2" v-lenis>
      <div
        v-if="messages.length === 0"
        class="text-muted-foreground flex h-full flex-col items-center justify-center gap-3"
      >
        <Sparkles class="h-8 w-8 opacity-30" :stroke-width="1" />
        <p class="text-center text-sm">
          Ask questions about your repository, get help with code, or generate commit messages.
        </p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="[
            'max-w-[90%] rounded-lg px-3 py-2 text-sm',
            msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-accent',
          ]"
        >
          {{ msg.content }}
        </div>
      </div>
    </div>

    <!-- Input area -->
    <div class="border-border/50 border-t p-3">
      <div class="relative">
        <textarea
          ref="inputRef"
          v-model="inputText"
          placeholder="Ask about your code..."
          rows="1"
          class="bg-accent/50 focus:ring-ring placeholder:text-muted-foreground w-full resize-none rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:ring-1"
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button
          @click="sendMessage"
          :disabled="!inputText.trim()"
          class="hover:bg-accent absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 transition-colors disabled:opacity-30"
        >
          <SendHorizonal class="h-3.5 w-3.5" :stroke-width="1.5" />
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, X, SendHorizonal } from 'lucide-vue-next'
import { useAppStore } from '@/stores/app.store'

const appStore = useAppStore()

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<Message[]>([])
const inputText = ref('')
const inputRef = ref<HTMLTextAreaElement | null>(null)

const sendMessage = () => {
  const text = inputText.value.trim()
  if (!text) return
  messages.value.push({ role: 'user', content: text })
  inputText.value = ''

  // Placeholder response — will be replaced with real AI integration
  setTimeout(() => {
    messages.value.push({
      role: 'assistant',
      content: 'AI integration coming soon. This is a placeholder response.',
    })
  }, 500)
}
</script>

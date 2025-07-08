<template>
  <component :is="icon" :class="className" :stroke-width="1" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  FileText, 
  FileCode, 
  FileImage, 
  FileJson,
  FileType,
  File
} from 'lucide-vue-next'

interface Props {
  filename: string
  className?: string
}

const props = defineProps<Props>()

const icon = computed(() => {
  const ext = props.filename.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'vue':
      return FileCode
    case 'json':
    case 'jsonc':
      return FileJson
    case 'md':
    case 'mdx':
    case 'txt':
      return FileText
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
      return FileImage
    case 'css':
    case 'scss':
    case 'less':
      return FileType
    default:
      return File
  }
})
</script>
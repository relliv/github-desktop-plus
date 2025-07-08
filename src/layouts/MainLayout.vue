<template>
  <div class="flex h-screen bg-background text-foreground">
    <!-- Title Bar -->
    <TitleBar />
    
    <!-- Sidebar -->
    <Sidebar />
    
    <!-- Main Content -->
    <main class="flex-1 flex flex-col pt-8 overflow-hidden">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import TitleBar from '../components/layout/TitleBar.vue'
import Sidebar from '../components/layout/Sidebar.vue'
</script>
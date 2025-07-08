<template>
  <div class="flex bg-background text-foreground">
    <div class="flex flex-col h-screen w-full">
      <!-- Title Bar -->
      <TitleBar />

      <div class="flex flex-row h-full">
        <!-- Sidebar -->
        <Sidebar />
        
        <!-- Main Content -->
        <main class="flex-1 flex flex-col overflow-hidden">
          <router-view />
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TitleBar from '../components/layout/TitleBar.vue'
import Sidebar from '../components/layout/Sidebar.vue'
</script>
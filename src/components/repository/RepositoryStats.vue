<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Repository Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Statistics and insights for this repository will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
</script>

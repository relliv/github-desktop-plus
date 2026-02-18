<template>
  <div class="h-full overflow-y-auto p-6">
    <div class="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle class="text-base">Commit History</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Commit history and branch timeline will be displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
</script>

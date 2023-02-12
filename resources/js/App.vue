<script setup>
// import { RouterView } from "vue-router";
</script>

<template>
  <!-- <router-link :to="{ name: 'Group', params: { groupName: 'gogo' } }">Chat</router-link> -->

  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'">
      <component :is="Component" />
    </transition>
  </router-view>

  <footer>
    <p>Created by innocent Peter for IpTechnopart </p>
  </footer>
</template>

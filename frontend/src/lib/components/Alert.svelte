<script lang="ts" context="module">
  export interface AlertMessage {
    title: string;
    message: string;
  }
  export type Type = "error" | "success";
</script>

<script lang="ts">
  import { fade } from "svelte/transition";
  import Close from "svelte-material-icons/Close.svelte";

  export let alertMessage: AlertMessage | undefined;
  export let type: Type;

  $: if (alertMessage) {
    setTimeout(() => {
      alertMessage = undefined;
    }, 3000);
  }

  const CloseButton = Close as any;
</script>

{#if alertMessage}
  <aside
    transition:fade|local={{ duration: 200 }}
    class={`alert fixed variant-filled-${type} left-1/4 right-1/4 bottom-10`}
  >
    <div class="alert-message">
      <h3 class="font-bold">{alertMessage.title}</h3>
      <p>{alertMessage.message}</p>
    </div>
    <!-- Actions -->
    <div class="alert-actions">
      <button
        on:click={() => {
          alertMessage = undefined;
        }}
      >
        <CloseButton size="3rem" />
      </button>
    </div>
  </aside>
{/if}

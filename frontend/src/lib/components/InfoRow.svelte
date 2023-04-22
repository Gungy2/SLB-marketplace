<script lang="ts">
  export let title: string;
</script>

<tr class="py-6 last:border-b-0 border-b-[1px]">
  <th class="w-1/3 pt-6 pb-2 text-left">{title}</th>
  <td class="pt-6 pb-2 text-left">
    <slot />
  </td>
</tr>

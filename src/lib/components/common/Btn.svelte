<script lang='ts'>
  export let 
    handleClick = () => {},
    title,
    type: 'button' | 'submit' | 'reset' = 'button',
    disabled=false,
    cssClass='bg-(--text-color) text-white';
</script>
<button
  disabled={disabled}
  type={type}
  on:click={handleClick}
  class="px-4 py-2 rounded font-semibold transition-all cursor-pointer {cssClass} duration-300 hover:scale-105">
  {title}
</button>

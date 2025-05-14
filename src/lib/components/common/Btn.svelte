<script lang='ts'>
  export let 
    handleClick = () => {},
    title,
    type: 'button' | 'submit' | 'reset' = 'button',
    disabled=false,
    cssClass='';
</script>
<button
  disabled={disabled}
  type={type}
  on:click={handleClick}
  class="px-4 py-2 rounded font-semibold transition-colors cursor-pointer {cssClass}">
  {title}
</button>

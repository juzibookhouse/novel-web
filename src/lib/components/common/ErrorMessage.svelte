<script lang="ts">
  export let error;
  const ERROR_MAPS:{[error:string]:string} = {
    'invalid_credentials': '用户名或密码错误',
    '23503': '用户名已存在'
  }
  const errorMsg = ERROR_MAPS[error.code] || error.message;
</script>
<div class="rounded-md border-2 border-red-500 text-red-500 p-4">
  {errorMsg}
</div>

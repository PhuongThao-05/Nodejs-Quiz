
async function ExpireandRenew() {
    const token=localStorage.getItem('token');
    if(!token)
    {
        return;
    }
    await fetch('/api/user/expire', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
         },
    });
    await fetch('/api/user/renewaccount', {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + localStorage.getItem('token')
         },
    });
}
document.addEventListener('DOMContentLoaded', async function () {
   ExpireandRenew();
});
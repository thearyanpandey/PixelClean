document.addEventListener('DOMContentLoaded', function(){
    const btnReload = document.getElementById('btnReload');

    //reload function if extension freezes
    btnReload.addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            if(tabs[0]){
                chrome.tabs.reload(tabs[0].id);
            }
        });
        window.close();
    })
})
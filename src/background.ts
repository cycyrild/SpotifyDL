chrome.action.onClicked.addListener((tab) => {
    const url = tab.url;
    if (url) {
        const popupUrl = `popup.html?url=${encodeURIComponent(url)}`;

        chrome.windows.create({
            url: popupUrl,
            type: 'popup',
            width: 600,
            height: 550,
            top: 100,
            left: 100
        });
    }

});

import { craftPopupUrl, parseMediaTypeAndIdFromUrl } from './utils';

chrome.action.onClicked.addListener((tab) => {
    const url = tab.url;
    if (url) {
        const parsedUrlArgs = parseMediaTypeAndIdFromUrl(url);

        const popupUrl = craftPopupUrl(parsedUrlArgs ? parsedUrlArgs[0] : '', parsedUrlArgs ? parsedUrlArgs[1] : '');

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

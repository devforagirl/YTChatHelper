// Message Relay: Receive danmaku from iframe -> Send to all frames in the current tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'NEW_MESSAGE_DATA' && sender.tab) {
        // Broadcast the message back to the tab so the top frame's content.js can receive it
        chrome.tabs.sendMessage(sender.tab.id, {
            type: 'ADD_DANMAKU',
            text: message.text
        }).catch(err => {
            // Top frame might not be ready yet, ignore
        });
    }
});
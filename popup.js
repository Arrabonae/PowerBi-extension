
function onTransformClick(event) {
  const index = event.target.dataset.index;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformElement', index: index }, (elementData) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(elementData.elementHtml, 'text/html');
      const transformElement = doc.querySelector('transform');
      if (transformElement) {
        chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
          const img = new Image();
          img.src = dataUrl;
          img.onload = () => {


            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            const rect = elementData.boundingClientRect;

            const margin = {
              left: elementData.scrollPosition.x + elementData.borderInfo.left + elementData.paddingInfo.left,
              top: elementData.scrollPosition.y + elementData.borderInfo.top + elementData.paddingInfo.top,
            };
            const scalingFactor = parseFloat(document.getElementById("scalingFactor").value);
            canvas.width = rect.width * scalingFactor;
            canvas.height = rect.height * scalingFactor;
            const scale = window.devicePixelRatio;
            context.drawImage(img, rect.left * scale + margin.left, rect.top * scale + margin.top, rect.width * scale, rect.height * scale, 0, 0, rect.width * scalingFactor, rect.height * scalingFactor);

            const croppedDataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = croppedDataUrl;
            const ariaLabel = transformElement.querySelector('.visualContainer').getAttribute('aria-label');

            if (ariaLabel == null) {
              link.download = `Element_${index}.png`;
            } else {
              link.download = `${ariaLabel}.png`;
            }

            link.click();

          };
        });
      } else {
        alert('Failed to download the Transform object as Image');
      }
    });
  });
}

async function exportAllTransforms() {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformObjects' }, async (transformObjects) => {
      for (let i = 0; i < transformObjects.length; i++) {

        const fakeEvent = {
          target: {
            dataset: {
              index: i,
            },
          },
        };

        onTransformClick(fakeEvent);
        await delay(1000);
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformObjects' }, (transformObjects) => {
      const transformList = document.getElementById('transformList');
      transformObjects.forEach((obj) => {
        const button = document.createElement('a');
        if (obj.ariaLabel == null) {
          button.textContent = `Element ${obj.id}`;
        } else {
          button.textContent = obj.ariaLabel;
        }
        button.dataset.index = obj.id;
        button.addEventListener('click', onTransformClick);
        button.className = 'btn waves-effect waves-orange transform-button';

        button.addEventListener('mouseover', () => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightTransform', index: obj.id });
        });
        button.addEventListener('mouseout', () => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'unhighlightTransform', index: obj.id });
        });

        transformList.appendChild(button);
      });

      const exportAllButton = document.createElement('a');
      exportAllButton.textContent = 'Export all';
      exportAllButton.className = 'btn waves-effect waves-orange export-all-button';
      exportAllButton.addEventListener('click', exportAllTransforms);
      transformList.appendChild(exportAllButton);
    });
  });
});

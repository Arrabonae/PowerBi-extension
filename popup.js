/**
 * Handles the click event of a transform object or group button.
 * Captures a screenshot of the selected element, scales it based on the chosen scaling factor,
 * and downloads the image as a PNG file.
 *
 * @param {Event} event - The click event fired when a transform object or group button is clicked.
 */
function onTransformClick(event) {
  const index = event.target.dataset.index;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformElement', index: index }, (elementData) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(elementData.elementHtml, 'text/html');
      const transformElement = doc.querySelector('transform');
      if (transformElement) {
        setTimeout(() => {
          chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, (dataUrl) => {
            chrome.tabs.getZoom(tabs[0].id, (zoomFactor) => {
              chrome.tabs.sendMessage(tabs[0].id, { action: 'scaleElement', index: index, scale: parseFloat(document.getElementById("scalingFactor").value) });
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
                const scale = window.devicePixelRatio * zoomFactor;
                canvas.width = rect.width * scalingFactor;
                canvas.height = rect.height * scalingFactor;

                context.drawImage(img, (rect.left + margin.left) * scale, (rect.top + margin.top) * scale, rect.width * scale, rect.height * scale, 0, 0, rect.width * scalingFactor, rect.height * scalingFactor);

                const croppedDataUrl = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.href = croppedDataUrl;
                const ariaLabel = transformElement.querySelector('.visualContainer').getAttribute('aria-label');
                const ariaDescription = transformElement.querySelector('.visualContainer').getAttribute('aria-roledescription');

                if (ariaLabel != null) {
                  link.download = `${ariaLabel}.png`;
                } else if (ariaDescription != null) {
                  link.download = `${ariaDescription}_${index}.png`;
                } else {
                  link.download = `Element_${index}.png`;
                }

                link.click();
              };
            });
          });
        }, 100);
      } else {
        alert('Failed to download the Transform object as Image');
      }
    });
  });
}


/**
 * Exports all transform objects as images.
 * Iterates through all transform objects, checks if their dimensions are greater than 60x60,
 * and simulates a click event to download the image for each transform object.
 */
async function exportAllTransforms() {
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const sizeThreshold = parseInt(document.getElementById('sizeThreshold').value, 10);
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
        if  (transformObjects[i].width >= sizeThreshold && transformObjects[i].height >= sizeThreshold) {
          onTransformClick(fakeEvent);
          await delay(1000);
        }

      }
    });
  });
}

/*
 * Adds transform groups to the list in the popup.
 * Iterates through each transformGroup object and creates a button with the appropriate event listeners and styling.
 */
function addTransformGroups(transformGroups) {
  const transformList = document.getElementById('transformList');
  transformGroups.forEach((obj) => {
    const button = document.createElement('a');
    button.textContent = obj.ariaLabel || `Group ${obj.id}`;
    button.dataset.index = obj.id;
    button.addEventListener('click', onTransformClick);
    button.className = 'btn waves-effect waves-orange transformGroup-button';

    button.addEventListener('mouseover', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightTransform', index: obj.id });
    });
  });
    button.addEventListener('mouseout', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'unhighlightTransform', index: obj.id });
    });
  });

    transformList.appendChild(button);
  });
}

/*
 * Adds transform objects to the list in the popup.
 * Iterates through each transformObject and creates a button with the appropriate event listeners and styling.
 */
function addTransformObjects(transformObjects) {
  const transformList = document.getElementById('transformList');
  const sizeThreshold = parseInt(document.getElementById('sizeThreshold').value, 10);
  let hasValidTransforms = false;
  transformObjects.forEach((obj) => {
    if (obj.width < sizeThreshold || obj.height < sizeThreshold) {
      return;
    }
    hasValidTransforms = true;
    const button = document.createElement('a');
    button.textContent = obj.ariaLabel || `${obj.ariaDescription}_${obj.id}`;
    button.dataset.index = obj.id;
    button.addEventListener('click', onTransformClick);
    button.className = 'btn waves-effect waves-orange transform-button';

    button.addEventListener('mouseover', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightTransform', index: obj.id });
    });
  });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    button.addEventListener('mouseout', () => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'unhighlightTransform', index: obj.id });
    });
  });
    transformList.appendChild(button);
  });
  if (hasValidTransforms) {
    const exportAllButton = document.createElement('a');
    exportAllButton.textContent = 'Export all';
    exportAllButton.className = 'btn waves-effect waves-orange export-all-button';
    exportAllButton.addEventListener('click', exportAllTransforms);
    transformList.appendChild(exportAllButton);
  }

}


document.addEventListener('DOMContentLoaded', () => {

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {


    chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformObjects' }, (transformObjects) => {
      addTransformObjects(transformObjects);
    });

  });

    // Update the transform objects when sizeThreshold input changes
    const sizeThresholdInput = document.getElementById('sizeThreshold');
    const sizeThresholdValue = document.getElementById('sizeThresholdValue');

    sizeThresholdInput.addEventListener('input', () => {
      sizeThresholdValue.textContent = sizeThresholdInput.value;
    });
    sizeThresholdInput.addEventListener('change', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getTransformObjects' }, (transformObjects) => {
          const transformList = document.getElementById('transformList');
          // Remove existing transform buttons
          while (transformList.firstChild) {
            transformList.firstChild.remove();
          }
          // Add updated transform buttons
          addTransformObjects(transformObjects);
        });
      });
    });
});

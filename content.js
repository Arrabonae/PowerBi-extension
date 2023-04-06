
/**
 * Finds and returns an array of transform objects present on the page.
 * @returns {Array} An array of transform object information including id, element, ariaLabel, ariaDescription, width, and height.
 */
function findTransformObjects() {
  const transformObjects = Array.from(document.getElementsByTagName('transform'));
  return transformObjects.map((el, index) => {
    const visualContainer = el.querySelector('.visualContainer');
    const ariaLabel = visualContainer ? visualContainer.getAttribute('aria-label') : '';
    const ariaDescription = visualContainer ? visualContainer.getAttribute('aria-roledescription') : '';
    return {
      id: index,
      transform: el,
      ariaLabel: ariaLabel,
      ariaDescription: ariaDescription,
      width: el.getAttribute('style').split('width: ')[1].split('px')[0],
      height: el.getAttribute('style').split('height: ')[1].split('px')[0]
    };
  });
}

/**
 * Finds and returns an array of transform groups present on the page.
 * @returns {Array} An array of transform group information including id, element, ariaLabel, width, and height.
 */
function findTransformGroups() {
  const transformGroups = Array.from(document.getElementsByTagName('transform'));
  return transformGroups.map((el, index) => {
    const visualContainer = el.querySelector('.visualContainerGroup');
    const ariaLabel = visualContainer ? visualContainer.getAttribute('aria-label') : '';
    return {
      id: index,
      transform: el,
      ariaLabel: ariaLabel,
      width: el.getAttribute('style').split('width: ')[1].split('px')[0],
      height: el.getAttribute('style').split('height: ')[1].split('px')[0]
    };
  });
}

/**
 * Highlights the transform object with the specified index by adding a box shadow.
 * @param {number} index - The index of the transform object to highlight.
 */
function highlightTransform(index) {
  const transformObject = document.getElementsByTagName('transform')[index];
  if (transformObject) {
    transformObject.style.boxShadow = '0 0 10px #800020';
  }
}

/**
 * Removes the highlight from the transform object with the specified index by removing the box shadow.
 * @param {number} index - The index of the transform object to unhighlight.
 */
function unhighlightTransform(index) {
  const transformObject = document.getElementsByTagName('transform')[index];
  if (transformObject) {
    transformObject.style.boxShadow = '';
  }
}

/**
 * Retrieves and returns the transform element with the specified index along with its relevant properties.
 * @param {number} index - The index of the transform element to retrieve.
 * @returns {Object|null} An object containing elementHtml, boundingClientRect, scrollPosition, borderInfo, and paddingInfo, or null if the element is not found.
 */
function getTransformElement(index) {
  const transformObject = document.getElementsByTagName('transform')[index];

  if (transformObject) {
    const boundingClientRect = transformObject.getBoundingClientRect();
    const borderInfo = {
      left: getComputedStyleProperty(transformObject, 'borderLeftWidth'),
      top: getComputedStyleProperty(transformObject, 'borderTopWidth'),
    };
    const paddingInfo = {
      left: getComputedStyleProperty(transformObject, 'paddingLeft'),
      top: getComputedStyleProperty(transformObject, 'paddingTop'),
    };
    const scrollPosition = {
      x: window.scrollX,
      y: window.scrollY,
    };

    return {
      elementHtml: transformObject.outerHTML,
      boundingClientRect,
      scrollPosition,
      borderInfo,
      paddingInfo,
    };
  } else {
    return null;
  }
}

/**
 * Gets and returns the computed style property value for the specified element and property.
 * @param {HTMLElement} element - The HTML element to get the computed style property from.
 * @param {string} property - The name of the CSS property to get the value for.
 * @returns {number} The numeric value of the specified property.
 */
function getComputedStyleProperty(element, property) {
  return parseFloat(window.getComputedStyle(element)[property]);
}

// Message listener for handling requests from the popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTransformObjects') {
    sendResponse(findTransformObjects());
  } else if (request.action === 'getTransformGroups') {
    sendResponse(findTransformGroups());
  } else if (request.action === 'highlightTransform') {
    highlightTransform(request.index);
  } else if (request.action === 'unhighlightTransform') {
    unhighlightTransform(request.index);
  } else if (request.action === 'getTransformElement') {
    sendResponse(getTransformElement(request.index));
  } else if (request.action === 'findTransformObjects') {
    sendResponse(findTransformObjects());
  } else if (request.action === 'scaleElement') {
    const element = document.getElementById(request.index);
    element.style.transform = `scale(${request.scale})`;
    element.style.transformOrigin = 'top left';
  }
});
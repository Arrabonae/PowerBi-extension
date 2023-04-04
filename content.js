
function findTransformObjects() {
  const transformObjects = Array.from(document.getElementsByTagName('transform'));
  return transformObjects.map((el, index) => {
    const visualContainer = el.querySelector('.visualContainer');
    const ariaLabel = visualContainer ? visualContainer.getAttribute('aria-label') : '';
    return {
      id: index,
      transform: el,
      ariaLabel: ariaLabel
    };
  });
}

function highlightTransform(index) {
  const transformObject = document.getElementsByTagName('transform')[index];
  if (transformObject) {
    transformObject.style.boxShadow = '0 0 10px #800020';
  }
}

function unhighlightTransform(index) {
  const transformObject = document.getElementsByTagName('transform')[index];
  if (transformObject) {
    transformObject.style.boxShadow = '';
  }
}

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

function getComputedStyleProperty(element, property) {
  return parseFloat(window.getComputedStyle(element)[property]);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTransformObjects') {
    sendResponse(findTransformObjects());
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

    document.body.appendChild(document.getElementById('drawing-layer'));

    [ 'data-rColor', 'data-tool' ].forEach(function(i) {
        document.querySelectorAll(`[${i}]`).forEach(function(item) {
            item.addEventListener('pointerdown', function(e) {
                document.querySelectorAll(`[${i}]`).forEach(function(i) {
                    i.setAttribute('data-current', false);
                });
                item.setAttribute('data-current', true);
                if(i == 'data-rColor') {
                    config.color = item.getAttribute(i);
                } else if(i == 'data-tool') {
                    config.tool = item.getAttribute(i);
                }
            });
        });
    });

    let config = {
        drawing: false,         
        tool: 'freeHand',       
		color : 'white',        
        strokeWidth: 4,         
        configNormalisation: 12,
        }

    let arrow = {
		topX: 0,
		topY: 0,
		bottomX: 0,      
		bottomY: 0,          
		activeDirection: 'se',                    
	    arrowClasses: [ 'nw', 'ne', 'sw', 'se' ], 
		lineAngle: 0,                             
	}
    let freeHand = {
		currentPathText: 'M0 0 ',      
		topX: 0,                       
		topY: 0,                       
        lastMousePoints: [ [0, 0] ],   
    }

    let svgEl = {
		arrowPath: (start, dimensions, path, dummy, direction, end, angle, hyp, id) => 
		`<div class="arrow drawing-el static current-item" data-id="${id}" data-direction="${direction}" 
			style="left: ${start[0]}px; top: ${start[1]}px; height: ${dimensions[1]}px; width: ${dimensions[0]}px;">
			<div class="arrow-point arrow-point-one"></div>
			<div class="arrow-point arrow-point-two" style="
				transform-origin: 0 0; left: ${hyp[1]}px; top: ${hyp[2]}px; transform: rotateZ(${angle}deg) translateY(-${hyp[0]}px) translateX(-15px);
			"></div>
			<svg viewbox="0 0 ${dimensions[0]} ${dimensions[1]}">
				<defs>
					<marker id="arrow-head-${id}" class="arrow-resizer" markerWidth="10" markerHeight="10" refX="0" refY="3" 
					orient="auto" markerUnits="strokeWidth" viewBox="0 0 20 20">
						<path d="M0 0 L0 6 L9 3 z" fill="${config.color}" />
					</marker>
				</defs>
				<path marker-start="url(#bottom-marker)" style="stroke: ${config.color}; stroke-width: ${config.strokeWidth}" marker-end="url(#arrow-head-${id})" class="arrow-line" d="${path}"></path>
			</svg>
		</div>`,
		drawPath: (start, dimensions, path, id) => 
		`<div class="free-hand drawing-el static current-item" data-id="${id}" style="left: ${start[0]}px; top: ${start[1]}px; height: ${dimensions[1]}px; width: ${dimensions[0]}px;">
			<svg viewbox="0 0 ${dimensions[0]} ${dimensions[1]}">			
				<path d="${path}" style="stroke: ${config.color}; stroke-width: ${config.strokeWidth}"></path>
			</svg>
		</div>`
    
	}

    document.getElementById('start-drawing').addEventListener('click', function(e) {
        if(config.drawing === true) {
            config.drawing = false;
            document.body.setAttribute('data-drawing', false)
        } else {   
            let drawingCover = document.getElementById('drawing-cover');
            document.body.setAttribute('data-drawing', true)
            config.drawing = true;
        }
    });

    document.querySelector('#drawing-box .close').addEventListener('click', function(e) {
        document.body.setAttribute('data-drawing', false);
        config.drawing = false;
    })

    document.body.addEventListener('pointerdown', function(e) { 
        
        if(helper.parent(e.target, '#drawing-box', 1) !== null && helper.parent(e.target, '#drawing-box', 1).matches('#drawing-box')) {
            return false;
        }

        let id = helper.generateId();
    
        if(config.tool == 'arrow' && config.drawing == true) {
            arrow.topX = e.clientX;
            arrow.topY = e.clientY;

			document.getElementById('drawing-layer').innerHTML = document.getElementById('drawing-layer').innerHTML + 
            svgEl.arrowPath(  [ arrow.topX + window.scrollX, arrow.topY + window.scrollY ], [  e.clientX, e.clientX ], `M0 0 L0 0`, 'arrow-item', arrow.arrowClasses[3], [ 0, 0 ], 0, [ 0, 0, 0 ], id );
        }
        else if(config.tool == 'freeHand' && config.drawing == true) {

            freeHand.topX = e.clientX;
            freeHand.topY = e.clientY;

            freeHand.currentPathText = `M${window.scrollX} ${window.scrollY} `;
            freeHand.lastMousePoints = [[ window.scrollX, window.scrollY ]];
            
            document.getElementById('drawing-layer').innerHTML = document.getElementById('drawing-layer').innerHTML + 
            svgEl.drawPath( [ e.clientX, e.clientY ], [ e.clientX, e.clientY ], ``, id);
        } 
        else if(config.tool == 'eraser' && config.drawing == true) {
            if(helper.parent(e.target, '.drawing-el', 1) !== null && helper.parent(e.target, '.drawing-el', 1).matches('.drawing-el')) {
                helper.parent(e.target, '.drawing-el', 1).remove();
            }
        }
    })

    document.body.addEventListener('pointermove', function(e) {

        if(document.querySelector('#drawing-layer .current-item') !== null) {
            if(config.drawing == true && config.tool == 'arrow') {
                let startX = arrow.topX;
                let startY = arrow.topY;
                let angleStart = 90;
                
                let arrowClass = arrow.arrowClasses[3];
                let endX = e.pageX - startX - window.scrollX;
                let endY = e.pageY - startY - window.scrollY;

                helper.calculateArrowLineAngle(endX, endY);
                arrow.bottomX = endX;
                arrow.bottomY = endY;
                
                document.querySelector('#drawing-layer .arrow.current-item').classList.remove('static');
                document.querySelector('#drawing-layer .arrow.current-item').setAttribute('data-direction', arrow.activeDirection);
                document.querySelector('#drawing-layer .arrow.current-item svg').setAttribute('viewbox', `0 ${endX} 0 ${endY}`);
                document.querySelector('#drawing-layer .arrow.current-item path.arrow-line').setAttribute('d', `M0 0 L${endX} ${endY}`);
            }
            
            else if(config.drawing == true && config.tool == 'freeHand') {
                let endX = e.pageX - freeHand.topX;
                let endY = e.pageY - freeHand.topY;
                
                let newCoordinates = [ endX, endY ];
                freeHand.lastMousePoints.push([endX, endY]);
                if(freeHand.lastMousePoints.length >= config.configNormalisation) {
                    freeHand.lastMousePoints.shift();
                }
                
                let avgPoint = helper.getAveragePoint(0);
                if (avgPoint) {
                    freeHand.currentPathText += " L" + avgPoint.x + " " + avgPoint.y;

                    let tmpPath = '';
                    for (let offset = 2; offset < freeHand.lastMousePoints.length; offset += 2) {
                        avgPoint = helper.getAveragePoint(offset);
                        tmpPath += " L" + avgPoint.x + " " + avgPoint.y;
                    }

                    document.querySelector('#drawing-layer .free-hand.current-item').classList.remove('static');
                    document.querySelector('#drawing-layer .free-hand.current-item svg path').setAttribute('d', freeHand.currentPathText + tmpPath);
                }

            }
        }
			
    });

    [ 'mouseleave', 'pointerup' ].forEach(function(item) {
        document.body.addEventListener(item, function(e) {
            document.querySelectorAll('#drawing-layer > div').forEach(function(item) {
                item.style.pointerEvent = 'all';
                item.classList.remove('current-item');
                if(item.classList.contains('static')) {
                    item.remove();
                }
            });
            freeHand.currentPathText = 'M0 0 ';
            freeHand.lastMousePoints = [ [0, 0] ];
        });
    });


    let helper = {
        
        getAveragePoint: function(offset) {
            let len = freeHand.lastMousePoints.length;
            if (len % 2 === 1 || len >= 8) {
                let totalX = 0;
                let totalY = 0;
                let pt, i;
                let count = 0;
                for (i = offset; i < len; i++) {
                    count++;
                    pt = freeHand.lastMousePoints[i];
                    totalX += pt[0];
                    totalY += pt[1];
                }

                return {
                    x: totalX / count,
                    y: totalY / count
                }
            }
            return null;
        },
        calculateArrowLineAngle: function(lineEndX, lineEndY) {
			
			var calcLineEndX = lineEndX;
			var calcLineEndY = lineEndY;
			var angleStart = 90;
			var angle = 0;
			var a = calcLineEndX;
			var b = calcLineEndY;
			var c = Math.sqrt(Math.pow(lineEndX, 2) + Math.pow(lineEndY, 2));
			
			if(calcLineEndX <= 0 && calcLineEndY >= 0) {
				// quadrant 3
				angleStart = 180;
				angle = Math.asin(a/c) * -1 * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[2];
			} else if(calcLineEndY <= 0 && calcLineEndX >= 0) {
				// quadrant 1
				angleStart = 0;
				angle = Math.asin(a/c) * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[1];
			} else if(calcLineEndY <= 0 && calcLineEndX <= 0) {
				// quadrant 4
				angleStart = 270;
				angle = Math.asin(b/c) * -1 * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[0];
			}
			else {
				// quadrant 2
				angleStart = 90;
				angle = Math.asin(b/c) * (180/Math.PI);
				arrow.activeDirection = arrow.arrowClasses[3];
			}
			
			arrow.lineAngle = angle + angleStart;
		},
        generateId: function() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        parent: function(el, match, last) {
            var result = [];
            for (var p = el && el.parentElement; p; p = p.parentElement) {
                result.push(p);
                if(p.matches(match)) {
                    break;
                }
            }
            if(last == 1) {
                return result[result.length - 1];
            } else {
                return result;
            }
        }
    }





    const selectableTextArea = document.querySelectorAll(".selectable-text-area");
const highlight = document.querySelector("#highlight");

selectableTextArea.forEach(elem => {
  elem.addEventListener("mouseup", selectableTextAreaMouseUp);
});

highlight.addEventListener("click", getSelectionHtml);

document.addEventListener("mousedown", documentMouseDown);

function selectableTextAreaMouseUp(event) {
  setTimeout(() => { 
    const selectedText = window.getSelection().toString().trim();
    if(selectedText.length) { 
      const x = event.pageX;
      const y = event.pageY;
      const highlightWidth = Number(getComputedStyle(highlight).width.slice(0,-2));
      const highlightHeight = Number(getComputedStyle(highlight).height.slice(0,-2));

      if(document.activeElement !== highlight) {
        highlight.style.left = `${x - highlightWidth*0.5}px`;
        highlight.style.top = `${y - highlightHeight*1.25}px`;
        highlight.style.display = "block";
        highlight.classList.add("btnEntrance");
      }
      else {
        highlight.style.left = `${x-highlightWidth*0.5}px`;
        highlight.style.top = `${y-highlightHeight*0.5}px`;
      }
    }    
  }, 0); 
}

function documentMouseDown(event) {
  if(event.target.id!=="highlight" && getComputedStyle(highlight).display==="block") {
    highlight.style.display = "none";
    highlight.classList.remove("btnEntrance");
    window.getSelection().empty();
  }
}



function getSelectionHtml() {
    var sel, range, node;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.getRangeAt && sel.rangeCount) {
            range = window.getSelection().getRangeAt(0);
            
            var html = '<span style="background: yellow;">' + range + '</span>'
            range.deleteContents();
            
            var el = document.createElement("div");
            el.innerHTML = html;
            var frag = document.createDocumentFragment(), node, lastNode;
            while ( (node = el.firstChild) ) {
                lastNode = frag.appendChild(node);
            }
            range.insertNode(frag);
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        range.collapse(false);
        range.pasteHTML(html);
    }

}
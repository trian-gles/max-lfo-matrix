const matrixElement = document.getElementById("matrix");

const createMatrix = (COLUMNS, ROWS) => {
    var selectedElement = null;
    var currXY = null;
    var mouseDownYPos;

    const createMatrixElement = (column, row, currentElement) => {
        const newCell = document.createElement("td");
        newCell.className = "numbox-unclicked";

        // and give it some content
        const newContent = document.createTextNode("0");

        newCell.onmousedown = (e) => {
            newCell.className = "numbox-clicked";
            selectedElement = newCell;
            mouseDownYPos = e.clientY;
            currXY = [row, column];
        }

        // add the text node to the newly created div
        newCell.appendChild(newContent);

        // add the newly created element and its content into the DOM
        currentElement.appendChild(newCell);
    }

    const createParamLabel = (column, currentElement) => {
        const newCell = document.createElement("td");
        const input = document.createElement("input");
        input.className = "param-input-label"

        input.value = column.toString();

        input.addEventListener("focus", (event) => {
            this.oldVal = input.value;
        });

        input.addEventListener("change", (event) => {
            clearParam(this.oldVal, column);
            outputParam(newCell, column);
            this.oldVal = input.value;
            
        });

        newCell.appendChild(input);
        currentElement.appendChild(newCell);
    }

    const createLFOLabel = (row, currentElement) => {
        const newCell = document.createElement("td");
        const textEll = document.createElement("div");
        const text = document.createTextNode("LFO freq:");
        textEll.appendChild(text);
        newCell.appendChild(textEll);
        const input = document.createElement("input");
        input.className = "lfo-input-label"

        input.value = row.toString();
        input.addEventListener("change", (event) => {
            outputLFO(newCell, row);
        });
        newCell.appendChild(input);
        currentElement.appendChild(newCell);
    }

    const addBlankSquare = (parent) => {
        let blankSquare = document.createElement("div");
        const newContent = document.createTextNode("Param names:");
        blankSquare.appendChild(newContent)
        parent.appendChild(blankSquare);
    }

    const addMatrix = () => {
        

        // clear anything existing
        matrixElement.textContent = '';

        let width = Math.floor(100 / (COLUMNS + 1)).toString() + '%'
        let height = Math.floor(100 / (ROWS + 1)).toString() + '%'

        // space columns
        for (let i = 0; i < COLUMNS + 1; i++){
            let colElement = document.createElement("col");
            colElement.style.width = width;
            colElement.style.height = height;
            matrixElement.appendChild(colElement);
        }

        
        // Param table
        let paramElement = document.createElement("tr");
        paramElement.id = "param-table";
        addBlankSquare(paramElement)
        
        for (let j = 0; j < ROWS; j++){
            createParamLabel(j, paramElement);
        }
        matrixElement.appendChild(paramElement);

        for (let i = 0; i < COLUMNS; i++){
            let rowElement = document.createElement("tr");

            createLFOLabel(i, rowElement);
            for (let j = 0; j < ROWS; j++){
                createMatrixElement(i, j, rowElement);
            }
            matrixElement.appendChild(rowElement);
            
        }

        
    }

    const onMouseMove = (e) => {
        if (selectedElement) {
            let delta = e.clientY - mouseDownYPos;
            let currnum = Number(selectedElement.textContent);
            currnum -= delta;
            selectedElement.textContent = currnum;
            mouseDownYPos = e.clientY;
            //window.max.outlet(currXY[0], currXY[1], currnum);
            outputCell(currXY[0], currXY[1], currnum);
        }
    }

    const onMouseUp = () => {
        if (selectedElement) {
            selectedElement.className = "numbox-unclicked";
            selectedElement = null;
            
        }
    }

    //document.body.onload = addMatrix;
    document.onmousemove = onMouseMove;
    document.onmouseup = onMouseUp;
    addMatrix();
}


const loopMatrix = (callback) => {
    let colElements = matrixElement.children;
    let i = 0;
    for (let c=0; c<colElements.length; c++){
        
        let colElement = colElements[c];
        if (colElement.nodeName !== 'TR' || colElement.id == "param-table")
            continue;

        let cells = colElement.children;
        
        for (var j=0; j < cells.length-1; j++){
            
            let cell = cells[j+1];
            
            callback(cell, i, j);
        }
        i++;
    }
}

const loopLFOs = (callback) => {
    let colElements = matrixElement.children;
    let i = 0;
    for (let c=0; c<colElements.length; c++){
        let colElement = colElements[c];
        if (colElement.nodeName !== 'TR' || colElement.id == "param-table")
            continue;

        let cell = colElement.firstChild;
        callback(cell, i);
        i++;
    }
}

const loopParamNames = (callback) => {
    var paramCells = document.getElementById("param-table").children;
    for (let i=1; i<paramCells.length; i++){
        callback(paramCells[i], i - 1);
    }
}

const outputLFO = (cell, i) => {
    window.max.outlet("lfo/" + i.toString() + "/freq/" + cell.children[1].value);
}

const clearParam = (oldVal, i) => {
    window.max.outlet("clearControlledParam/" + oldVal);
}

const outputParam = (cell, i) => {
    window.max.outlet("newControlledParam/" + cell.firstChild.value);
}


const dumpLFOs = () => {
    loopLFOs(outputLFO);
}

const makeKey = (name, i, j) => { return name + "|" + i.toString() + "|" + j.toString() }

const saveMatrix = (name) => {
    let saveData = {}

    let matrix = [];
    loopMatrix((cell, i, j) => {
        if (i >= matrix.length)
            matrix.push([])

        matrix[i].push(cell.textContent)
        //window.max.setDict(makeKey(name, i, j), cell.textContent);
    });

    let lfos = [];
    let paramNames = [];

    loopLFOs((cell, i) => {
        lfos.push(cell.children[1].value);
    });

    loopParamNames((cell, i) => {
        paramNames.push(cell.firstChild.value);
    });

    saveData.lfos = lfos;
    saveData.matrix = matrix;
    saveData.paramNames = paramNames

    window.max.getDict('localStorage', (dict) => {
        dict[name] = saveData
        window.max.setDict('localStorage', dict);
    });
}

const loadMatrix = (name) => {
    window.max.getDict('localStorage', (dict) => {
        let matrix = dict[name].matrix;
        loopMatrix((cell, i, j) => {
            cell.textContent = matrix[i][j].toString();
        });

        let lfos = dict[name].lfos;
        loopLFOs((cell, i) => {
            cell.children[1].value = lfos[i];
        });

        let paramNames = dict[name].paramNames;
        loopParamNames((cell, i) => {
            cell.firstChild.value = paramNames[i];
        });
        dumpAll();
    });
}

const dumpMatrix = () => {
    loopMatrix((cell, i, j) => {
            outputCell(i, j, cell.textContent);
        });

}

const dumpParamNames = () => {
    loopParamNames(outputParam);
}

const dumpAll = () => {
    window.max.outlet("clear");
    dumpParamNames();
    dumpLFOs();
    dumpMatrix();
    
}

const outputCell = (i, j, val) => {

    var lfoIndex = j;
    var paramTable = document.getElementById("param-table");
    var element = paramTable.children[i + 1].firstChild;
    var paramName = element.value;
    window.max.outlet("lfoMatrix/" + lfoIndex.toString() + "/" + paramName + "/" + val.toString());
}

const eraseParam = (paramName) => {
    window.max.outlet("clearControlledParam/" + paramName);
}


window.max.bindInlet("dims", createMatrix);
window.max.bindInlet("save", saveMatrix);
window.max.bindInlet("load", loadMatrix);
window.max.bindInlet("dump", dumpAll);


createMatrix(3, 3);

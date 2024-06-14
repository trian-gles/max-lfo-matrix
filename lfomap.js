var lfoCount = jsarguments[1];

var cachedParams = {}

function LFO() {
    this.phase = 0;
    this.freq = 0.4;
    this.lastTime = new Date().getTime();

    this.sample = function() {
        var time = new Date().getTime();
        var deltaSeconds = (time - this.lastTime) / 1000;
        this.lastTime = time;
        var phaseChange = deltaSeconds * this.freq;
        this.phase = (this.phase + phaseChange) % 1;
        
        return Math.sin(this.phase * 2 * Math.PI);
    }


}

var lfos = []
for (var i=0; i<lfoCount; i++){
    lfos[i] = new LFO();
}

function ControlledParam(name, center){
    this.center = center;
    this.name = name;
    this.lfoControl = []
    for (var i = 0; i < lfoCount; i++){
        this.lfoControl.push(1);
    }

    this.sample = function(lfoVals) {
        var val = this.center;
        for (var i = 0; i < lfoCount; i++){ 
            val += lfoVals[i] * this.lfoControl[i]
        } 
        
        return val
    }
    
}

var controlledParams = {};

function bang(){
    var lfoVals = [];
    for (var i = 0; i < lfoCount; i++){
        lfoVals.push(lfos[i].sample());
    }
    for (var prop in controlledParams){
        var arg = controlledParams[prop].name + "/" + controlledParams[prop].sample(lfoVals).toString();
        outlet(0, controlledParams[prop].name, controlledParams[prop].sample(lfoVals));
    }
    
}

// ARG SYSTEM

// register LFO controlled parameter : newControlledParam/{name}

// remove : clearControlledParam/{name}

// change center value for LFO controlled parameter : controlledParam/{name}/{centerVal}

// change LFO matrix routing amplitude : lfoMatrix/{LFOindex}/{paramName}/{val}

// change LFO param
//          frequency : lfo/{LFOindex}/freq/{freq}
//          shape : lfo/{LFOindex}/shape/{shape} "sine" "sawdown" "sawup" "triangle" "rect"

function anything(){
    var a = arrayfromargs(messagename, arguments);
    var args = a[0].split("/")
    if (args[0] == "controlledParam"){
        var paramName = args[1];
        var val = parseInt(args[2])
        cachedParams[paramName] = val;
        if (paramName in controlledParams){
            
            controlledParams[paramName].center = val;
            
            post(val)
        }
        else {
            
            outlet(0, a);
        }
    }
    else if (args[0] == "newControlledParam"){
        var paramName = args[1];
        if (!(paramName in controlledParams)){
            
            if (!paramName in cachedParams){
                cachedParams[paramName] = 0;
                post("Remember to configure a center point for " + paramName);
            }
                
            post(cachedParams[paramName])
            controlledParams[paramName] = new ControlledParam(paramName, cachedParams[paramName]);
        }
        else
            post(paramName + " is already defined");
    }
    else if (args[0] == "clearControlledParam"){
        var paramName = args[1];
        if ((paramName in controlledParams))
            delete controlledParams[paramName];
        else
            post(paramName + " is not a defined parameter!");
    }
    else if (args[0] == "clear"){
        controlledParams = {};
    }
    else if (args[0] == "lfoMatrix"){
        var lfoIndex = parseInt(args[1]);
        var paramName = args[2];
        
        var val = parseInt(args[3]);
        controlledParams[paramName].lfoControl[lfoIndex] = val;
    }
    else if (args[0] == "lfo"){
        var lfoIndex = parseInt(args[1]);
        var val = parseFloat(args[3]);
        lfos[lfoIndex].freq = val;
    }
    else {
        error("arguments not understood : " + args)
    }
}


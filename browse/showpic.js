// Javascript code for flipping through an hour's worth of images from imgcomp
// Invoked from HTML generated by view.cgi module showpic.c

thismin_last = -1
flags_last = "x"
function UpdateActagram(){
// Update the actagram text character display below the nav links.    
    act = ""
    var thismin
    if (piclist.length) thismin = parseInt(piclist[pic_index].substring(0,2))
    if (thismin == thismin_last && flags_last == flagsstr) return;
    thismin_last = thismin
    flags_last = flagsstr;

    for (a=0;a<60;a++){
        if (!(b = ActBins[a])){
            act += "&nbsp;"; continue
        }
        c = '-'
        if (b>=6)c='='
        if (b>=18)c='#'
        if (a==thismin){
            act += "<b style='background-color: #b0b0ff;'>"+c+"</b>"
        }else{
            act += "<a href='#"+flagsstr+prefix+piclist[ActNums[a]]+".jpg"
                + "' onclick='SetIndex("+ActNums[a]+")'>"+c+"</a>"
        }
    }
    document.getElementById("actagram").innerHTML = "00"+act+"60"
}
NextImgUrl = ""
flagsstr = ""
SaveResp = ""
function UpdatePix(){
    if (piclist.length){
        var imgname = subdir+prefix+piclist[pic_index]+".jpg"
        var url = pixpath+imgname;
        flagsstr = ""
        if (AdjustBright){
            flagsstr = "b";
            url = "tb.cgi?"+imgname+(ShowBigOn?"$1":"$2")
        }
        if (!document.getElementById("view").complete){
            NextImgUrl = url;
        }else{
            document.getElementById("view").src = url
        }
        if (ShowBigOn) flagsstr = flagsstr + "e";
        if (flagsstr != "") flagsstr = flagsstr +","
        var nch = "#"+flagsstr+prefix+piclist[pic_index]+".jpg"
        if (nch != currenthash){
            if (nch.substring(0,5) == currenthash.substring(0,5) || currenthash == ""){
                // If only image# changed, don't fill up the browser history.
                history.replaceState({}, imgname, nch)
            }else{
                location.hash = nch
            }
            currenthash = nch
            document.title = imgname
        }
        var n = prefix+piclist[pic_index];
        document.getElementById("this").innerHTML = n.substring(5,7)+":"+n.substring(7,9)+":"+n.substring(9,11)
    }
        
    UpdateActagram()
    if (SaveResp){
        document.getElementById("save").innerHTML = "Save"
        SaveResp = ""
    }
}

function DoNext(dir){
    if (pic_index+dir < 0 || pic_index+dir >= piclist.length){
        PlayStop()
        return 0
    }else{
        pic_index += dir
        UpdatePix();
        return 1
    }
}

ScrollDir = 0
ScrollTimer = 0
function ScrollMoreTimer()
{
    ScrollTimer = 0
    var img = document.querySelector('img')
    if (!document.getElementById("view").complete) return;

    if (ScrollDir){
        if (DoNext(ScrollDir)){
            ScrollTimer = setTimeout(ScrollMoreTimer,isSavedDir?400:100)
        }
    }
}

// Functon runs when picture is loaded.
// Check size, and reschedule next picture in animation
LastWidth = LastHeight = 0;
function picLoaded()
{
    if (vc.naturalWidth != LastWidth || vc.naturalHeight != LastHeight){
        LastWidth = vc.naturalWidth;
        LastHeight = vc.naturalHeight;
        SizeImage();
    }
    
    if (NextImgUrl){
        document.getElementById("view").src = NextImgUrl
        NextImgUrl = ""
    }else{
        if (ScrollDir && !ScrollTimer) ScrollMoreTimer();
    }
}

function SetIndex(index)
{
    pic_index = index
    UpdatePix()
}

function PlayStart(dir)
{
    ScrollDir = dir
    DoNext(ScrollDir)
    ScrollTimer = setTimeout(ScrollMoreTimer, 400)
}
function PlayStop()
{
    ScrollDir = 0
    document.getElementById("play").innerHTML="Play"
    clearTimeout(ScrollTimer)
    ScrollTimer = 0
}

function PlayButtonClick()
{
    if (ScrollDir){
        PlayStop()
    }else{
        if (pic_index >= piclist.length-1) pic_index = 0
        PlayStart(1)
        document.getElementById("play").innerHTML="Stop"
    }
}

function PrevNextDirLinkUpdate()
{
    if (PrevDir) document.getElementById("prevdir").href = "view.cgi?"+PrevDir+"/#"+flagsstr
    if (NextDir) document.getElementById("nextdir").href = "view.cgi?"+NextDir+"/#"+flagsstr
}


DragActive = false
xref = 0;
ref_index = 0;
MouseIsDown = 0

TouchDebounce = false; // Touch and mouse events arrive out of order on iPad, so "debounce" to avoid turning
                        // single taps into double taps.

function PicMouse(picX,picY,IsDown)
{
    DbgAdd("pm("+IsDown+")")
    picX -= vc.offsetLeft
    picY -= vc.offsetTop
    //dbg.innerHTML = "Mouse "+picX+", "+picY+" Down="+IsDown;
    if (IsDown){
        var leftright = 0;
        if (picX < ShwW*.2) leftright = -1
        if (picX > ShwW*.8) leftright = 1
        if (!MouseIsDown){
            // Mouse was just pressed.
            if (leftright){
                // Start playing forwards or backwards.
                if (!TouchDebounce) PlayStart(leftright)
            }else{
                // Start of drag scrolling.
                xref = picX;
                ref_index = pic_index;
                ScrollDir = 0
                DragActive = true
            }
        }else{
            if (ref_index >= 0){
                // Drag scrolling is active.
                var relmove = (picX-xref)/ShwW;
                var targindex = Math.round(ref_index+relmove*piclist.length);
                if (targindex < 0) targindex = 0
                if (targindex >= piclist.length) targindex = piclist.length-1
                pic_index = targindex
                UpdatePix()
            }else{
                if (leftright == 0){
                    // Drag start out of left/right region
                    PlayStop();
                    xref = picX
                    ref_index = pic_index;
                    DragActive = true
                }
            }
        }
    }else{
        if (MouseIsDown){
            // Mouse was just released.
            PlayStop();
        }
        ref_index = -1;
        DragActive = false;
    }
    MouseIsDown = IsDown;
}


function SavePicClick(){
    // Instruct back end to copy picture to the "Saved" directory.
    var SaveUrl = "view.cgi?~"+subdir+prefix+piclist[pic_index]+".jpg"
    var xhttp = new XMLHttpRequest()
    xhttp.onreadystatechange=function(){
        if (this.readyState==4 && this.status==200){
            SaveResp=xhttp.responseText.trim()
            var fi = SaveResp.indexOf('Fail:')
            if(fi>=0) SaveResp="<span style='color: rgb(255,0,0);'>"+SaveResp.substring(fi+5)+"</span>"
            document.getElementById("save").innerHTML=SaveResp
        }
    };
    xhttp.open("GET", SaveUrl, true)
    xhttp.send()
}

function UpdBrBt() { document.getElementById("bright").innerHTML= AdjustBright?"Normal":"Brighten"}
ShowBigOn = false
function ShowBigClick(){
    ShowBigOn = !ShowBigOn
    SizeImage();
    UpdatePix()
    PrevNextDirLinkUpdate()
}
AdjustBright = false
function ShowBrightClick(){
    AdjustBright = !AdjustBright
    UpdBrBt()
    UpdatePix()
    PrevNextDirLinkUpdate()
}

function ShowDetailsClick(){
    var nu = window.location.toString()
    nu = nu.substring(0,nu.indexOf("#"))+prefix+piclist[pic_index]+".jpg"
    window.location = nu
}

function SizeImage()
{
    document.getElementById("big").innerHTML= ShowBigOn?"Smaller":"Enlarge"
    if (ShowBigOn){
        vc.width = vc.naturalWidth;
        vc.height = vc.naturalHeight;
        ShwW = vc.width;
        ShwH = vc.height;
        return;
    }
    maxw = 950; maxh = 650
    //maxw = 600; maxh = 350
    
    ShwW = maxw
    if (ShwW > window.innerWidth-15) ShwW = window.innerWidth-15;
    if (piclist.length == 0){
        return;
    }
    if (vc.naturalWidth > 0){
        ShwH = Math.round(ShwW*vc.naturalHeight/vc.naturalWidth)
        if (ShwH > maxh){
            ShwH = maxh;
            ShwW = Math.round(ShwH*vc.naturalWidth/vc.naturalHeight)
        }
    }else{
        console.log("Unknown width")
        ShwW = 320; ShwH = 240
    }
    vc.width = ShwW
    vc.height = ShwH
}

vc = document.getElementById('view');
vc.onload = picLoaded

// Functions to consolidate the various ways of reporting mouse or finger actions into one place.
// so that it works the same way on PC and iPad
function picMouseDown(e) { DbgAdd("picMD");PicMouse(e.clientX,e.clientY,1); }
function picMouseMove(e) { DbgAdd("picMM");PicMouse(e.clientX,e.clientY,MouseIsDown); }
function picDrag(e){
    if ((e.clientY-vc.offsetTop) < ShwH*.2) return true; // Allow dragging image out of brwser near top.
    DbgAdd("picDrag")
    PicMouse(e.clientX,e.clientY,1);
    return false;
}
function picMouseUp() {DbgAdd("picMU");PicMouse(0,0,0);}

function picTouchStart(e){DbgAdd("picTS");TouchDebounce=false;PicMouse(e.touches[0].clientX,e.touches[0].clientY,1);}
function picTouchMove(e){DbgAdd("picTM");PicMouse(e.touches[0].clientX,e.touches[0].clientY,1)}
function picTouchEnd(e){DbgAdd("picTE");TouchDebounce=true;PicMouse(0,0,0);}

vc.ondragstart = picDrag
vc.onmousedown = picMouseDown
vc.onmouseup = picMouseUp
vc.onmouseleave = picMouseUp
vc.onmousemove = picMouseMove

vc.ontouchstart = picTouchStart
vc.ontouchend = picTouchEnd
vc.ontouchmove = picTouchMove

// Fill bins for actagram (a sort of motion time histogram)
ActBins = []
ActNums = []
for (a=0;a<piclist.length;a++){
    min = parseInt(piclist[a].substring(0,2))
    if (ActBins[min]) ActBins[min]++
    else ActBins[min] = 1
    if (!ActNums[min] || piclist[a].substring(2,4) < "30") ActNums[min] = a;
}

pic_index=0
currenthash = "x"
// Read hash and figure out which image to load with what settings.
// Used for direct links to iamge, page reload, and back button URL changes.
function ReadHash(){
    var pct = location.hash.replace("%20", " ");
    if (currenthash == pct) return;
    currenthash = pct
    
    if (pct){
        var ci = pct.indexOf(",");
        var flags = ""
        if (ci > 0 && ci < 5){
            flags=pct.substring(0,ci)
            pct = pct.substring(ci)
        }
        var nab = flags.indexOf("b") >= 0
        if (nab != AdjustBright){
            AdjustBright = nab;
            UpdBrBt();
        }
        var lsb = ShowBigOn;
        ShowBigOn = flags.indexOf("e") >= 0
        if (lsb != ShowBigOn && LastWidth !=0) SizeImage();
        
        // Figure out index in picture list based on URL after '#'
        var m = pct.substring(prefix.length+1)
        if (m.substring(m.length-4) == ".jpg") m = m.substring(0,m.length-4)
        for (pic_index=0;pic_index<piclist.length-1;pic_index++){
            if (piclist[pic_index] >= m) break;
        }
        if (pct == "first") pic_index = 0;
        if (pct == "last") pic_index = piclist.length-1
        //console.log("big:"+ShowBigOn+"   Bright:"+AdjustBright);
    }else{
        pic_index = 0
        AdjustBright = ShowBigOn = false;
    }
    UpdatePix();
    PrevNextDirLinkUpdate();
}

window.onhashchange = ReadHash
ReadHash();
function DbgAdd(msg){
//  dbg = (dbg+" "+msg)
//  document.getElementById("dbg").innerHTML = dbg
}

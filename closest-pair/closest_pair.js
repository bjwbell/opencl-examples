
function Vector(x, y){
  this.x = x;
  this.y = y;
  this.color = '#000';
  this.size = 5;
  this.draw = function(canvas) {
    var context = canvas.getContext('2d');
    context.fillStyle = this.color; //black    
    var tthis = transformCoords(x, y);
    context.fillRect(tthis.x - this.size/2, tthis.y - this.size/2, this.size, this.size);

  };
  this.scalarMult = function(scalar){
	  return new Vector(this.x * scalar, this.y * scalar);
  };
  this.dot = function(v2) {
    return this.x * v2.x + this.y * v2.y;
  };
  this.perp = function() {
    return new Vector(-1 * this.y, this.x);
  };
  this.subtract = function(v2) {
    return this.add(v2.scalarMult(-1));//new Vector(this.x - v2.x, this.y - v2.y);
  };
  this.add = function(v2) {
	  return new Vector(this.x + v2.x, this.y + v2.y);
  };
}

// returns the distance between p and q.
function dist(p, q){   
    try {
        var d = Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
        return d;
    } catch (err)
    {
        throw err;
    }    
}

var width = 800;
var height = 600;
var points = new Array();
points.push([100, 100]);
points.push([200, 200]);
points.push([300, 50]);
points.push([100, 50]);

function getCanvas() {
  return document.getElementById('canvas');
}

window.addEventListener('load', function() {
			  var canvas = getCanvas();
			  if(canvas && canvas.getContext) {
				  initCanvas();
			  }
			  canvas.addEventListener('mousemove', mouseMove, false);
			  canvas.addEventListener('mousedown', mouseDown, false);


}, false);

function getEventXCoord(ev){
 if(ev.layerX){ //Firefox
   return ev.layerX;
 }
 return ev.offsetX; //Opera
}
function getEventYCoord(ev){
 if(ev.layerY){ //Firefox
   return ev.layerY;
 }
 return ev.offsetY; //Opera
}

function initCanvas(){
    var canvas = getCanvas();
    context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#fff'; //white
    context.strokeStyle = '#000'; //black
    context.lineWidth = 4;
}

function mouseDown(ev){	
    var x = getEventXCoord(ev);
    var y = getEventYCoord(ev);
    y = 600 - y;
    points.push([x, y]);
    CL_ClosestPair(points);
    drawPoints();
}

function computeClosestPoints()
{
    var closest = -1;
    var idx1 = -1;
    var idx2 = -1;
    for (var i = 0; i < points.length; i++)
    {
        for (var j = 0; j < points.length; j++)
        {
            if (j == i)
            {
                continue;
            }
            if (closest == -1 || closest > dist([points[i][0], points[i][1]], [points[j][0], points[j][1]])) 
            {
                closest = dist([points[i][0], points[i][1]], [points[j][0], points[j][1]]);
                idx1 = i;
                idx2 = j;
            } 
        }
    }
    return [idx1, idx2];

}

function sortPointsByY(points)
{
    var points2 = points.slice(0);
    points2.sort(function (p1, p2) { return p1[1] - p2[1]; });
    return points2;
}

function computeClosestRecursive(points)
{
    var points_sorted_by_x = points.slice(0);
    points_sorted_by_x.sort(function (p1, p2) { return p1[0] - p2[0]; });
    var points2 = []
    for (var i = 0; i < points_sorted_by_x.length; i++)
    {
	points2.push([points_sorted_by_x[i][0], points_sorted_by_x[i][1],
		      i]);
    }
    var points_sorted_by_y = sortPointsByY(points2);
    return computeClosestPointsRecursive(points2, points_sorted_by_y);
}


// we assume points is already sorted by x-coordinate and that they 
// are tagged with the sorted y-index
function computeClosestPointsRecursive(points, points_sorted_by_y)
{
    if (points.length <= 3){
        var d1 = dist([points[0][0], points[0][1]], [points[1][0], points[1][1]]);        
	if (points.length < 3)
        {
            return [0, 1];
        }
        var d2 = dist([points[0][0], points[0][1]], [points[2][0], points[2][1]]);
        var d3 = dist([points[1][0], points[1][1]], [points[2][0], points[2][1]]);
        if (d1 <= d2 && d1 <= d3)
        {
            return [0, 1];
        } else if (d2 <= d1 && d2 <= d3)
        {
            return [0, 2];
        } else {
            return [1, 2];
        }
    }
    var mid_point_idx = Math.floor(points.length/2);
    var idx_l = computeClosestPointsRecursive(points.slice(0, mid_point_idx), points_sorted_by_y);

    var idx_r = computeClosestPointsRecursive(points.slice(mid_point_idx), points_sorted_by_y);
    if (idx_r[1] >= points.slice(mid_point_idx).length)
    {
	var x =_____ddjsldsklds___;
    }
    idx_r[0] = idx_r[0] + mid_point_idx;
    idx_r[1] = idx_r[1] + mid_point_idx;
    var d_l = dist(points[idx_l[0]], points[idx_l[1]]);
    var d_r = dist(points[idx_r[0]], points[idx_r[1]]);
    var min_idx1 = idx_l[0];
    var min_idx2 = idx_l[1]; 
    if (d_r <= d_l){
        min_idx1 = idx_r[0];
        min_idx2 = idx_r[1];
    }
    //alert('mid_point_idx:' + mid_point_idx + ', d_l: ' + d_l + ', d_r: ' + d_r);
    var d_min = Math.min(d_l, d_r);
    var points_strip = [];
    
    for (var i = 0; i < points_sorted_by_y.length; i++)
    {
        if (Math.abs(points_sorted_by_y[i][0] - points[mid_point_idx][0]) <= d_min &&
	   points_sorted_by_y[i][0] >= points[0][0] && points_sorted_by_y[i][0] <= points[points.length - 1][0]
	   && points_sorted_by_y[i][2] >= points[0][2] && points_sorted_by_y[i][2] <= points[points.length - 1][2])
        {
            points_strip.push(points_sorted_by_y[i]);
        }
    }
    //alert('strip:' + points_strip);
    var min_in_strip = false;
    for (var i = 0; i < points_strip.length; i++)
    {
        for (var j = i + 1; j - i <= 8 && j < points_strip.length; j++)
        {
            var d = dist(points_strip[i], points_strip[j]);
            if (d < d_min)
            {
                d_min = d;
                min_idx1 = i;
                min_idx2 = j;
                min_in_strip = true;
            }
        }
    }
    if (min_in_strip)
    {
        var find_idx1 = true;
        var find_idx2 = true;
	var p_y_min_idx1 = min_idx1;
        for (var i = 0; i < points.length; i++)
        {
            if (find_idx1 && points[i][0] == points_strip[min_idx1][0] && points[i][1] == points_strip[min_idx1][1])
            {
                min_idx1 = i;
                find_idx1 = false;
            } else if (find_idx2 && points[i][0] == points_strip[min_idx2][0] && points[i][1] == points_strip[min_idx2][1])
            {
                min_idx2 = i;
                find_idx2 = false;
            } 
            if (find_idx1 == false && find_idx2 == false)
            {
                break;
            }
        }
	if (find_idx2 == true)
	{
	    var q = ___djisj;
	}

    }
    //alert('points: ' + points + ' idx1, idx2: ' + min_idx1 + ', ' + min_idx2);
    return [min_idx1, min_idx2];
}
function drawPoints()
{
    //var closestPoints = computeClosestPoints();
    points.sort(function (p1, p2) {return p1[0] - p2[0];});
    var closestPoints = computeClosestRecursive(points);
    for(var i = 0; i < points.length; i++){
	    var p = new Vector(points[i][0], points[i][1]);
	    p.color = '#000';
        if (i == closestPoints[0] || i == closestPoints[1])
        {
	        p.color = '#F00';
        }
	    p.size = 10;
	    p.draw(canvas);
    }
    var output = document.getElementById("output");
    //output.innerHTML += "<br/>";
    output.innerHTML += "JS Closest Pair: (" + points[closestPoints[0]][0] + ", " + points[closestPoints[0]][1] + "), (" + points[closestPoints[1]][0] + ", " + points[closestPoints[1]][1] + ")";
    output.innerHTML += "<br/>";
}

function mouseMove(ev) {
};

// take an x and y from the source coordinate system to the canvas coordinate system
function transformCoords(x, y){
  var width = 800;
  var height = 600;
  var result = new Vector(x - 15, height - y - 5);
  return result;
}



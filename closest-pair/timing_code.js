function generatePoints(numPoints, x_range, y_range, minDist)
{
    var points = new Array();
    for (var i = 0; i < numPoints; i++)
    {
	var dup = true;
	while (dup)
	{
	    dup = false;
	    var x = Math.floor(Math.random() * x_range);
	    var y = Math.floor(Math.random() * y_range);
	    for (var j = 0; j < i; j++){
		if ((points[j][0] == x && points[j][1] == y) || dist(points[j], [x, y]) < minDist)
		{
		    dup = true;
		    break;
		}
	    
	    }
	}
	points.push([x, y]);	
    }
    return points;
}

function TimeOCL_JS()
{
    var points = new Array();
    //var numPoints = 10;
    for (var numPoints = 500; numPoints <= 3000; numPoints = numPoints + 500)
    {
	    points = generatePoints(numPoints, 256 * numPoints, 256 * numPoints, Math.floor(Math.random() * 10));
        points.sort(function (p1, p2) {return p1[0] - p2[0];});
	    var JS_Start = (new Date()).getTime();
	    var closestPoints = computeClosestRecursive(points);
	    var JS_Time = (new Date()).getTime() - JS_Start;
	    var OCL = CL_ClosestPair(points, false, true, false);
	    var OCL_Time = OCL[0];
	    var output = document.getElementById("output");
	    //output.innerHTML += "<br/>";
        /*output.innerHTML += "Points: ";
	      for (var i = 0; i < points.length; i++)
          {
	      output.innerHTML += "(" + points[i][0] + ", " + points[i][1] + "),";
          }*/
        output.innerHTML += "<br/>";
        output.innerHTML += "NumPoints:" + numPoints + "<br/>";
	    output.innerHTML += "JS: Time = " + JS_Time + " millisec(s)" + ", Pair: (" + points[closestPoints[0]][0] + ", " + points[closestPoints[0]][1] + "), (" + points[closestPoints[1]][0] + ", " + points[closestPoints[1]][1] + "), d = " + dist(points[closestPoints[0]], points[closestPoints[1]]);
        output.innerHTML += "<br/>";
	    output.innerHTML += "CL: Time = " + (OCL_Time) + " millisec(s)"  + ", Pair: (" + OCL[1] + ", " + OCL[2] + "), (" + OCL[3] + ", " + OCL[4] + "), d = " + dist([OCL[1], OCL[2]], [OCL[3], OCL[4]]);
	    output.innerHTML += "<br/>";
    }    
}

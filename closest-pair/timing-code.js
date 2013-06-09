"use strict";
var dist, computeClosestRecursive, clClosestPair, output;
function generatePoints(numPoints, x_range, y_range, minDist) {
    var points = [],
        i,
        j,
        dup,
        x,
        y;

    for (i = 0; i < numPoints; i = i + 1) {
        dup = true;
        while (dup) {
            dup = false;
            x = Math.floor(Math.random() * x_range);
            y = Math.floor(Math.random() * y_range);
            for (j = 0; j < i; j = j + 1) {
                if ((points[j][0] === x && points[j][1] === y) || dist(points[j], [x, y]) < minDist) {
                    dup = true;
                    break;
                }
            }
        }
        points.push([x, y]);
    }
    return points;
}

function timeOCLJS() {
    var points = [],
        numPoints,
        JS_Start,
        closestPoints,
        JS_Time,
        OCL,
        OCL_Time,
        sortFunction,
        i;
    sortFunction = function (p1, p2) {return p1[0] - p2[0]; };
    for (numPoints = 500; numPoints <= 3000; numPoints = numPoints + 500) {
        points = generatePoints(numPoints, 256 * numPoints, 256 * numPoints, Math.floor(Math.random() * 10));
        points.sort(sortFunction);
        JS_Start = (new Date()).getTime();
        closestPoints = computeClosestRecursive(points);
        JS_Time = (new Date()).getTime() - JS_Start;
        OCL = clClosestPair(points, false, true, false);
        OCL_Time = OCL[0];
        output = document.getElementById("output");
        output.innerHTML += "<br/>";
        output.innerHTML += "NumPoints:" + numPoints + "<br/>";
        output.innerHTML += "JS: Time = " + JS_Time + " millisec(s)" + ", Pair: (" + points[closestPoints[0]][0] + ", " + points[closestPoints[0]][1] + "), (" + points[closestPoints[1]][0] + ", " + points[closestPoints[1]][1] + "), d = " + dist(points[closestPoints[0]], points[closestPoints[1]]);
        output.innerHTML += "<br/>";
        output.innerHTML += "CL: Time = " + (OCL_Time) + " millisec(s)"  + ", Pair: (" + OCL[1] + ", " + OCL[2] + "), (" + OCL[3] + ", " + OCL[4] + "), d = " + dist([OCL[1], OCL[2]], [OCL[3], OCL[4]]);
        output.innerHTML += "<br/>";
        if (dist(points[closestPoints[0]], points[closestPoints[1]]) !== dist([OCL[1], OCL[2]], [OCL[3], OCL[4]])) {
            output.innerHTML += "<br/>";
            output.innerHTML += "Points: ";
            for (i = 0; i < points.length; i = i + 1) {
                output.innerHTML += "(" + points[i][0] + ", " + points[i][1] + "),";
            }
            break;
        }
    }
}

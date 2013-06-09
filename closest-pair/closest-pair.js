"use strict";
var window, clClosestPair, drawPoints, computeClosestPointsRecursive, canvas;

var width = 800;
var height = 600;
var points = [];
points.push([100, 100]);
points.push([200, 200]);
points.push([300, 50]);
points.push([100, 50]);

function Vector(x, y) {
    this.x = x;
    this.y = y;
    this.color = '#000';
    this.size = 5;
    this.draw = function (canvas) {
        var context = canvas.getContext('2d'),
            tthis = (function (x, y) {
                var width = 800,
                    height = 600,
                    result = new Vector(x - 15, height - y - 5);
                return result;
            }(x, y));
        context.fillStyle = this.color; //black
        context.fillRect(tthis.x - this.size / 2, tthis.y - this.size / 2, this.size, this.size);
    };
    this.scalarMult = function (scalar) {
        return new Vector(this.x * scalar, this.y * scalar);
    };
    this.dot = function (v2) {
        return this.x * v2.x + this.y * v2.y;
    };
    this.perp = function () {
        return new Vector(-1 * this.y, this.x);
    };
    this.subtract = function (v2) {
        return this.add(v2.scalarMult(-1));//new Vector(this.x - v2.x, this.y - v2.y);
    };
    this.add = function (v2) {
        return new Vector(this.x + v2.x, this.y + v2.y);
    };
}

// returns the distance between p and q.
function dist(p, q) {
    try {
        var d = Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
        return d;
    } catch (err) {
        throw err;
    }
}

function getCanvas(document) {
    return document.getElementById('canvas');
}

function initCanvas(document) {
    var canvas = getCanvas(document),
        context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#fff'; //white
    context.strokeStyle = '#000'; //black
    context.lineWidth = 4;
}

function getEventXCoord(ev) {
    if (ev.layerX) { //Firefox
        return ev.layerX;
    }
    return ev.offsetX; //Opera
}
function getEventYCoord(ev) {
    if (ev.layerY) { //Firefox
        return ev.layerY;
    }
    return ev.offsetY; //Opera
}

function mouseDown(ev) {
    var x = getEventXCoord(ev),
        y = getEventYCoord(ev);
    y = 600 - y;
    points.push([x, y]);
    clClosestPair(points);
    drawPoints();
}

window.addEventListener('load', function () {
    var canvas = getCanvas(document);
    if (canvas && canvas.getContext) {
        initCanvas(document);
    }
    canvas.addEventListener('mousedown', mouseDown, false);
}, false);

function computeClosestPoints() {
    var i, j,
        closest = -1,
        idx1 = -1,
        idx2 = -1;
    for (i = 0; i < points.length; i = i + 1) {
        for (j = 0; j < points.length; j = j + 1) {
            if (j === i) {
                continue;
            }
            if (closest === -1 || closest > dist([points[i][0], points[i][1]], [points[j][0], points[j][1]])) {
                closest = dist([points[i][0], points[i][1]], [points[j][0], points[j][1]]);
                idx1 = i;
                idx2 = j;
            }
        }
    }
    return [idx1, idx2];
}

function sortPointsByY(points) {
    var points2 = points.slice(0);
    points2.sort(function (p1, p2) { return p1[1] - p2[1]; });
    return points2;
}

function computeClosestRecursive(points) {
    var i = 0,
        points_sorted_by_x = points.slice(0),
        points_sorted_by_y = [],
        points2 = [];

    points_sorted_by_x.sort(function (p1, p2) { return p1[0] - p2[0]; });
    points2 = [];
    for (i = 0; i < points_sorted_by_x.length; i = i + 1) {
        points2.push([points_sorted_by_x[i][0], points_sorted_by_x[i][1],
                      i]);
    }
    points_sorted_by_y = sortPointsByY(points2);
    return computeClosestPointsRecursive(points2, points_sorted_by_y);
}


// we assume points is already sorted by x-coordinate and that they
// are tagged with the sorted y-index
function computeClosestPointsRecursive(points, points_sorted_by_y) {
    var mid_point_idx,
        idx_l,
        idx_r,
        d_l,
        d_r,
        min_idx1,
        min_idx2,
        d1,
        d2,
        d3,
        d_min,
        points_strip,
        i,
        min_in_strip,
        j,
        d,
        find_idx1,
        find_idx2,
        p_y_min_idx1;

    if (points.length <= 3) {
        d1 = dist([points[0][0], points[0][1]], [points[1][0], points[1][1]]);
        if (points.length < 3) {
            return [0, 1];
        }
        d2 = dist([points[0][0], points[0][1]], [points[2][0], points[2][1]]);
        d3 = dist([points[1][0], points[1][1]], [points[2][0], points[2][1]]);
        if (d1 <= d2 && d1 <= d3) {
            return [0, 1];
        }
        if (d2 <= d1 && d2 <= d3) {
            return [0, 2];
        }
        return [1, 2];
    }
    mid_point_idx = Math.floor(points.length / 2);
    idx_l = computeClosestPointsRecursive(points.slice(0, mid_point_idx), points_sorted_by_y);

    idx_r = computeClosestPointsRecursive(points.slice(mid_point_idx), points_sorted_by_y);
    //if (idx_r[1] >= points.slice(mid_point_idx).length)
    //{
    //    var x =_____ddjsldsklds___;
    //}
    idx_r[0] = idx_r[0] + mid_point_idx;
    idx_r[1] = idx_r[1] + mid_point_idx;
    d_l = dist(points[idx_l[0]], points[idx_l[1]]);
    d_r = dist(points[idx_r[0]], points[idx_r[1]]);
    min_idx1 = idx_l[0];
    min_idx2 = idx_l[1];
    if (d_r <= d_l) {
        min_idx1 = idx_r[0];
        min_idx2 = idx_r[1];
    }
    //alert('mid_point_idx:' + mid_point_idx + ', d_l: ' + d_l + ', d_r: ' + d_r);
    d_min = Math.min(d_l, d_r);
    points_strip = [];

    for (i = 0; i < points_sorted_by_y.length; i = i + 1) {
        if (Math.abs(points_sorted_by_y[i][0] - points[mid_point_idx][0]) <= d_min) {
            if (points_sorted_by_y[i][0] >= points[0][0] && points_sorted_by_y[i][0] <= points[points.length - 1][0]) {
                if (points_sorted_by_y[i][2] >= points[0][2] && points_sorted_by_y[i][2] <= points[points.length - 1][2]) {
                    points_strip.push(points_sorted_by_y[i]);
                }
            }
        }
    }
    //alert('strip:' + points_strip);
    min_in_strip = false;
    for (i = 0; i < points_strip.length; i = i + 1) {
        for (j = i + 1; j - i <= 8 && j < points_strip.length; j = j + 1) {
            d = dist(points_strip[i], points_strip[j]);
            if (d < d_min) {
                d_min = d;
                min_idx1 = i;
                min_idx2 = j;
                min_in_strip = true;
            }
        }
    }
    if (min_in_strip) {
        find_idx1 = true;
        find_idx2 = true;
        p_y_min_idx1 = min_idx1;
        for (i = 0; i < points.length; i = i + 1) {
            if (find_idx1 && points[i][0] === points_strip[min_idx1][0] && points[i][1] === points_strip[min_idx1][1]) {
                min_idx1 = i;
                find_idx1 = false;
            } else if (find_idx2 && points[i][0] === points_strip[min_idx2][0] && points[i][1] === points_strip[min_idx2][1]) {
                min_idx2 = i;
                find_idx2 = false;
            }
            if (find_idx1 === false && find_idx2 === false) {
                break;
            }
        }
//        if (find_idx2 === true) {
//            var q = ___djisj;
//        }

    }
    //alert('points: ' + points + ' idx1, idx2: ' + min_idx1 + ', ' + min_idx2);
    return [min_idx1, min_idx2];
}

function drawPoints() {
    var i,
        p,
        output,
        closestPoints;

    points.sort(function (p1, p2) {return p1[0] - p2[0]; });
    closestPoints = computeClosestRecursive(points);
    for (i = 0; i < points.length; i = i + 1) {
        p = new Vector(points[i][0], points[i][1]);
        p.color = '#000';
        if (i === closestPoints[0] || i === closestPoints[1]) {
            p.color = '#F00';
        }
        p.size = 10;
        p.draw(getCanvas(document));
    }
    output = document.getElementById("output");
    //output.innerHTML += "<br/>";
    output.innerHTML += "JS Closest Pair: (" + points[closestPoints[0]][0] + ", " + points[closestPoints[0]][1] + "), (" + points[closestPoints[1]][0] + ", " + points[closestPoints[1]][1] + ")";
    output.innerHTML += "<br/>";
}

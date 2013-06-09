#pragma OPENCL EXTENSION all : enable
__kernel void ckDiffs(__global long3* points, 
		      __global long4* diffs, 
                      unsigned int numPoints) {
  unsigned int idx = get_global_id(0);
  // compute the distance
  if (idx <= numPoints/2 - 1) {
      diffs[idx].hi = points[idx * 2 + 1].xy;
      diffs[idx].lo = points[idx * 2].xy;
  }
  // if the number of points is not even, e.g numPoints = 15
  // then the last diff borrows from idx * 2 - 1.
  else if (numPoints % 2 && idx == (numPoints+1)/2 -1)
  {      
      diffs[idx].hi = points[idx * 2 - 1].xy;
      diffs[idx].lo = points[idx * 2].xy;
  }
}

__kernel void ckStrips(__global long3* pointsByY, 
		       __global long3* pointsByX,
		       __global long4 *diffs,
		       __global long2* strip,
		       unsigned int numPoints,
		       unsigned int maxStripSize
                       ) {
  unsigned int strip_idx = get_global_id(0);
  // round up to handle cases where numPoints is not a multiple of 
  // maxStripSize.
  unsigned int numStrips = (numPoints + maxStripSize - 1)/maxStripSize;
  unsigned int stripLength = 0;
  long xMidPoint = 0;
  if (strip_idx > numStrips || numPoints <= 2){
    return;
  }

  unsigned int xMidPointIdx = (maxStripSize/2 - 1) + maxStripSize * strip_idx;

  // use min to handle the case for non power of 2 points.
  xMidPointIdx = min(xMidPointIdx, numPoints - 1);
  xMidPoint = pointsByX[xMidPointIdx].x;

  float diffDist1 = distance(convert_float2(diffs[strip_idx * maxStripSize/2].lo), 
			     convert_float2(diffs[strip_idx * maxStripSize/2].hi));

  // the strip_idx * maxStripSize/2 + maxStripSize/4 + 1 < numPoints check is to handle
  // cases where strip2 doesn't exist, e.g. numPoints = 15 and maxStripSize = 4, then 
  // diff[strip_idx * maxStripSize/2 + maxStripSize/4] won't have been calculated by ckDiffs
  if (strip_idx * maxStripSize/2 + maxStripSize/4 < (numPoints+1)/2)
  {
      float diffDist2 = distance(convert_float2(diffs[strip_idx * maxStripSize/2 + 1 * maxStripSize/4].lo), 
				 convert_float2(diffs[strip_idx * maxStripSize/2 + 1 * maxStripSize/4].hi));
      if (diffDist2 < diffDist1) 
      {
	  diffs[strip_idx * maxStripSize/2] = diffs[strip_idx * maxStripSize/2 + 1 * maxStripSize/4];
      }
  }
  float diffDist = distance(convert_float2(diffs[strip_idx * maxStripSize/2].lo), convert_float2(diffs[strip_idx * maxStripSize/2].hi));
  long minIdx = strip_idx * maxStripSize;

  long maxIdx = min(strip_idx * maxStripSize + maxStripSize - 1, numPoints - 1);
  for (int i = 0; i < numPoints; i++){
      float dist = fabs(pointsByY[i].x - xMidPoint);
      if (dist < diffDist && (pointsByY[i].s2 >= minIdx && pointsByY[i].s2 <= maxIdx))	  
      {
	  strip[strip_idx * maxStripSize + stripLength] = pointsByY[i].xy;
	  stripLength++;
      }       
  }

  for (int i = 0; i < stripLength; i++) {
      int j = i + 1;
      float diffDist = distance(convert_float2(diffs[strip_idx * maxStripSize/2].lo), convert_float2(diffs[strip_idx * maxStripSize/2].hi));
      while(j < stripLength && fabs(strip[strip_idx * maxStripSize + i].y - strip[strip_idx * maxStripSize + j].y) < diffDist) {
	  diffDist = distance(convert_float2(diffs[strip_idx * maxStripSize/2].lo), convert_float2(diffs[strip_idx * maxStripSize/2].hi));
	  if (diffDist > distance(convert_float2(strip[strip_idx * maxStripSize + i]), convert_float2(strip[strip_idx * maxStripSize + j])))
	  {
	      diffs[strip_idx * maxStripSize/2].lo = strip[strip_idx * maxStripSize + i];
	      diffs[strip_idx * maxStripSize/2].hi = strip[strip_idx * maxStripSize + j];
	  }
	  j++;
      }
  }
}

__kernel void ckDiffs(__global uint3* points, 
		      __global uint3* diffs, 
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

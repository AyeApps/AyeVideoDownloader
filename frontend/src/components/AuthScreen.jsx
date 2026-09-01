import React, { useState, useEffect } from 'react';
import './AuthScreen.css';

// Exact AyeLogo from AyeTasks
const AyeLogo = ({ width = 56, color = '#FE9D01' }) => {
  const calculatedHeight = Math.round(width / 1.739);
  return (
    <svg
      width={width}
      height={calculatedHeight}
      viewBox="300 170 800 460"
      fill="none"
      style={{ display: 'block' }}
    >
      <g fill={color}>
        <path d="M0 0 C15.18 0 30.36 0 46 0 C50.03 8.635 54.001 17.147 57.572 25.956 C58.745 28.846 59.933 31.73 61.121 34.615 C61.329 35.119 61.537 35.624 61.745 36.129 C65.781 45.938 69.913 55.707 74.04 65.477 C74.782 67.232 75.522 68.988 76.263 70.743 C77.275 73.143 78.288 75.541 79.302 77.94 C79.676 78.826 80.05 79.712 80.424 80.598 C82.884 86.428 85.41 92.226 88 98 C88 99.65 88 101.3 88 103 C87.776 103.354 87.551 103.708 87.32 104.072 C86.189 105.858 85.062 107.647 83.938 109.438 C83.832 109.606 83.726 109.775 83.616 109.949 C78.936 117.405 74.398 124.947 69.875 132.5 C69.832 132.571 69.832 132.571 69.616 132.932 C67.408 136.62 65.203 140.309 63 144 C60.314 140.887 58.739 137.477 57.159 133.709 C56.804 132.864 56.442 132.021 56.08 131.178 C55.375 129.529 54.676 127.879 53.979 126.227 C53.409 124.876 52.837 123.526 52.263 122.177 C52.18 121.983 52.098 121.79 52.013 121.59 C51.846 121.196 51.678 120.803 51.511 120.409 C49.504 115.692 47.512 110.968 45.523 106.243 C45.09 105.214 44.657 104.186 44.224 103.157 C42.046 97.988 39.875 92.816 37.712 87.641 C37.245 86.523 36.778 85.406 36.31 84.289 C31.692 73.262 27.286 62.161 23 51 C19.706 57.894 16.589 64.837 13.73 71.922 C13.661 72.094 13.591 72.266 13.52 72.444 C12.714 74.443 11.912 76.443 11.111 78.444 C9.564 82.312 8.003 86.174 6.442 90.036 C6.183 90.678 5.924 91.319 5.665 91.961 C1.754 101.645 -2.24 111.294 -6.25 120.938 C-6.424 121.357 -6.599 121.776 -6.773 122.195 C-7.122 123.036 -7.472 123.877 -7.822 124.717 C-8.622 126.642 -9.422 128.566 -10.222 130.491 C-10.492 131.141 -10.763 131.792 -11.034 132.442 C-13.881 139.29 -16.711 146.144 -19.534 153.002 C-20.192 154.6 -20.85 156.199 -21.508 157.797 C-21.834 158.589 -22.161 159.381 -22.487 160.173 C-22.703 160.698 -22.919 161.223 -23.136 161.748 C-24.403 164.826 -25.67 167.905 -26.934 170.984 C-27.725 172.91 -28.517 174.835 -29.311 176.759 C-29.769 177.871 -30.226 178.982 -30.681 180.094 C-31.102 181.122 -31.525 182.149 -31.95 183.176 C-32.101 183.543 -32.251 183.91 -32.401 184.278 C-33.763 187.621 -35.376 190.752 -37 194 C-51.85 194 -66.7 194 -82 194 C-78.561 182.537 -78.561 182.537 -76.672 178.359 C-76.448 177.851 -76.224 177.342 -76.002 176.833 C-75.516 175.726 -75.027 174.621 -74.535 173.516 C-73.25 170.629 -71.986 167.732 -70.721 164.836 C-70.401 164.105 -70.082 163.375 -69.762 162.645 C-66.685 155.615 -63.666 148.561 -60.66 141.5 C-60.543 141.225 -60.426 140.95 -60.305 140.667 C-58.847 137.241 -57.391 133.815 -55.934 130.389 C-53.672 125.066 -51.406 119.744 -49.141 114.422 C-48.766 113.539 -48.39 112.656 -48.014 111.772 C-43.38 100.883 -38.728 90.001 -34.062 79.125 C-34.019 79.024 -34.019 79.024 -33.8 78.512 C-32.28 74.969 -30.759 71.425 -29.239 67.882 C-26.104 60.577 -22.974 53.271 -19.845 45.964 C-18.869 43.685 -17.893 41.406 -16.917 39.127 C-16.848 38.966 -16.78 38.806 -16.709 38.64 C-16.084 37.181 -15.458 35.721 -14.833 34.262 C-14.418 33.292 -14.003 32.322 -13.587 31.352 C-13.519 31.193 -13.451 31.033 -13.38 30.869 C-12.286 28.314 -11.193 25.76 -10.099 23.205 C-9.001 20.641 -7.903 18.077 -6.804 15.512 C-6.204 14.11 -5.603 12.707 -5.003 11.304 C-4.448 10.009 -3.893 8.713 -3.338 7.418 C-3.136 6.947 -2.935 6.477 -2.734 6.006 C-2.46 5.365 -2.185 4.724 -1.91 4.084 C-1.832 3.9 -1.754 3.717 -1.673 3.528 C-1.156 2.325 -0.588 1.176 0 0 Z " transform="translate(457,179)" />
        <path d="M0 0 C0.31 0.082 0.62 0.165 0.939 0.25 C12.59 3.369 24.268 8.283 34.254 15.129 C37.035 17.082 39.678 19.199 42.275 21.389 C43.014 22.011 43.756 22.628 44.499 23.245 C54.923 31.965 63.438 42.139 70.292 53.884 C78.359 67.864 82.917 83.252 85.74 99.074 C86.899 105.681 87.807 112.289 88 119 C88.004 119.112 88.004 119.112 88.023 119.677 C88.046 120.365 88.067 121.054 88.086 121.742 C88.092 121.938 88.098 122.133 88.104 122.335 C88.213 127.023 87.906 131.677 87.492 136.344 C87.444 136.897 87.397 137.45 87.349 138.003 C87.235 139.335 87.118 140.668 87 142 C75.83 142.212 64.659 142.393 53.488 142.553 C52.815 142.562 52.143 142.572 51.47 142.582 C26.648 142.939 1.831 143.052 -59.187 142.567 C-59.856 142.561 -60.526 142.554 -61.195 142.548 C-78.464 142.382 -95.732 142.199 -113 142 C-112.394 144.626 -111.783 147.251 -111.167 149.874 C-110.881 151.093 -110.597 152.313 -110.315 153.533 C-108.577 161.07 -106.562 168.09 -103 175 C-102.877 175.243 -102.754 175.485 -102.628 175.735 C-98.695 183.485 -93.996 190.439 -87.64 196.411 C-79.536 203.864 -70.072 209.341 -59.965 213.602 C-49.908 217.78 -38.914 219.438 -28.081 219.959 C-16.939 220.423 -5.683 218.47 4.911 215.108 C15.072 211.836 24.905 207.181 33.42 200.679 C38.917 196.392 43.778 191.544 48 186 C54.871 189.435 60.351 196.142 65.668 201.698 C66.864 202.966 68.034 204.255 69.188 205.562 C69.323 205.714 69.459 205.865 69.599 206.021 C71.515 208.164 72.824 210.38 74 213 C71.733 215.727 69.385 218.377 67 221 C66.897 221.114 66.897 221.114 66.376 221.689 C57.827 231.082 48.46 238.58 37.2 244.52 C23.341 251.746 8.375 255.649 -7 258 C-7.46 258.073 -7.919 258.145 -8.379 258.218 C-24.46 260.701 -41.832 259.258 -57.728 256.156 C-71.355 253.433 -84.99 248.38 -96.885 241.174 C-108.446 234.083 -119.45 224.928 -127.951 214.333 C-137.373 202.415 -144.393 189.473 -149.242 175.078 C-149.371 174.697 -149.5 174.317 -149.63 173.936 C-151.43 168.655 -152.525 163.565 -153 158 C-152.83 157.842 -152.66 157.685 -152.484 157.522 C-150.321 155.517 -148.16 153.509 -146 151.5 C-145.914 151.42 -145.914 151.42 -145.477 151.014 C-141.442 147.259 -137.418 143.504 -133.562 139.562 C-130.983 136.925 -128.302 134.468 -125.498 132.071 C-122.695 129.671 -120.085 127.128 -117.503 124.493 C-114.749 121.687 -111.881 119.058 -108.877 116.521 C-106.075 114.136 -103.637 111.637 -101 109 C-52.82 109 -4.64 109 45 109 C38.298 79.51 38.298 79.51 31.962 69.631 C27.971 63.581 22.959 58.258 18 53 C8.128 46.353 -1.658 39.981 -13.361 37.067 C-23.261 34.752 -33.975 34.396 -44.062 35.562 C-53.663 36.778 -62.632 40.256 -71.25 44.562 C-79.267 48.711 -85.635 54.708 -92 61 C-98.361 70.601 -103.446 80.439 -108 91 C-111.542 94.651 -115.137 98.189 -119 101.5 C-121.61 103.737 -124.098 106.041 -126.5 108.5 C-128.862 110.918 -131.305 113.18 -133.875 115.375 C-136.892 117.953 -139.719 120.669 -142.5 123.5 C-145.22 126.269 -147.98 128.924 -150.938 131.438 C-154.352 134.34 -157.501 137.461 -160.643 140.653 C-163.531 143.583 -166.478 146.374 -169.611 149.038 C-172.61 151.592 -175.395 154.321 -178.124 157.161 C-180.625 159.731 -183.133 161.706 -186 164 C-195.24 164.33 -204.48 164.66 -214 165 C-214.874 167.16 -215.748 169.321 -216.648 171.547 C-217.238 173.004 -217.828 174.461 -218.418 175.918 C-218.494 176.107 -218.571 176.295 -218.65 176.49 C-219.225 177.91 -219.8 179.33 -220.375 180.75 C-220.416 180.852 -220.416 180.852 -220.625 181.366 C-224.892 191.902 -229.171 202.433 -233.477 212.953 C-233.569 213.18 -233.662 213.407 -233.758 213.64 C-235.551 218.023 -237.346 222.404 -239.142 226.786 C-240.281 229.565 -241.42 232.345 -242.559 235.125 C-242.652 235.353 -242.745 235.581 -242.841 235.815 C-245.55 242.431 -248.239 249.054 -250.908 255.686 C-263.961 288.118 -263.961 288.118 -270.342 301.6 C-270.971 302.932 -271.579 304.272 -272.186 305.613 C-275.671 313.284 -280.194 319.812 -285.483 326.355 C-285.96 326.95 -286.429 327.551 -286.894 328.156 C-291.661 334.354 -297.56 339.28 -304.151 343.471 C-311.824 348.283 -320.055 351.404 -328.889 353.309 C-339.538 355.547 -349.862 355.735 -360.639 354.224 C-370.25 352.835 -379.883 350.327 -388.497 345.735 C-394.298 342.562 -400.568 338.95 -405 334 C-403.752 329.912 -402.209 326.117 -400.285 322.305 C-400.026 321.785 -399.767 321.265 -399.508 320.745 C-398.97 319.666 -398.43 318.589 -397.887 317.513 C-397.198 316.147 -396.516 314.777 -395.837 313.405 C-395.305 312.335 -394.77 311.266 -394.233 310.198 C-393.98 309.694 -393.729 309.19 -393.478 308.684 C-391.919 305.542 -390.215 302.725 -388 300 C-384.782 301.185 -381.962 302.556 -379.092 304.43 C-375.006 307.07 -370.787 309.071 -366.25 310.812 C-365.982 310.917 -365.714 311.022 -365.438 311.13 C-360.477 313.055 -355.498 314.121 -350.169 314.24 C-349.738 314.245 -349.306 314.248 -348.875 314.25 C-348.649 314.252 -348.423 314.255 -348.19 314.257 C-342.253 314.28 -336.651 312.679 -331 311 C-324.787 307.375 -320.044 303.284 -315.434 297.758 C-313.456 295.356 -312.166 292.573 -310.75 289.812 C-310.665 289.647 -310.581 289.482 -310.493 289.312 C-306.367 281.243 -302.936 272.878 -299.5 264.5 C-299.432 264.334 -299.363 264.167 -299.293 263.996 C-297.518 259.668 -295.753 255.336 -294 251 C-294.576 246.573 -296.253 242.635 -297.976 238.56 C-298.393 237.57 -298.805 236.578 -299.218 235.586 C-299.932 233.871 -300.649 232.157 -301.369 230.444 C-302.419 227.945 -303.463 225.444 -304.506 222.942 C-306.098 219.125 -307.691 215.309 -309.287 211.494 C-312.897 202.862 -316.483 194.22 -320.066 185.577 C-320.698 184.052 -321.331 182.526 -321.963 181.001 C-326.582 169.866 -331.177 158.721 -335.711 147.551 C-336.152 146.464 -336.594 145.376 -337.035 144.289 C-337.147 144.013 -337.259 143.737 -337.375 143.453 C-339.462 138.313 -341.564 133.178 -343.668 128.045 C-352.378 106.803 -361.034 85.54 -369.625 64.25 C-369.684 64.103 -369.684 64.103 -369.983 63.362 C-370.805 61.327 -371.626 59.291 -372.447 57.256 C-372.55 57.001 -372.652 56.746 -372.758 56.484 C-374.84 51.323 -376.92 46.161 -379 41 C-386.59 41 -394.18 41 -402 41 C-406.168 47.732 -410.308 54.472 -414.34 61.285 C-414.431 61.44 -414.523 61.594 -414.617 61.753 C-415.663 63.521 -416.708 65.289 -417.753 67.057 C-419.817 70.552 -421.886 74.045 -423.957 77.535 C-424.062 77.712 -424.167 77.889 -424.275 78.072 C-427.387 83.315 -430.526 88.54 -433.699 93.746 C-433.793 93.9 -433.887 94.054 -433.983 94.212 C-435.182 96.18 -436.383 98.146 -437.583 100.113 C-442.376 107.962 -447.124 115.82 -451.57 123.872 C-456.355 132.535 -461.518 140.979 -466.657 149.436 C-466.992 149.987 -467.327 150.538 -467.661 151.089 C-468.828 153.009 -469.997 154.928 -471.171 156.844 C-471.512 157.4 -471.852 157.957 -472.192 158.514 C-472.651 159.264 -473.112 160.013 -473.574 160.762 C-473.64 160.87 -473.64 160.87 -473.973 161.415 C-474.095 161.612 -474.217 161.808 -474.343 162.01 C-474.394 162.095 -474.394 162.095 -474.657 162.521 C-475 163 -475 163 -476 164 C-496.79 164.165 -496.79 164.165 -602 165 C-620.421 208.751 -620.421 208.751 -625.761 222.062 C-626.955 225.039 -628.157 228.014 -629.357 230.989 C-629.643 231.699 -629.93 232.41 -630.216 233.12 C-632.759 239.435 -635.359 245.725 -638 252 C-638.33 252.33 -638.66 252.66 -639 253 C-654.18 253 -669.36 253 -685 253 C-681.503 241.345 -681.503 241.345 -679.095 235.95 C-678.917 235.546 -678.738 235.142 -678.56 234.738 C-678.469 234.533 -678.379 234.329 -678.286 234.119 C-677.803 233.024 -677.327 231.925 -676.85 230.827 C-676.036 228.955 -675.218 227.084 -674.397 225.215 C-673.103 222.265 -671.817 219.311 -670.532 216.356 C-670.425 216.109 -670.318 215.862 -670.207 215.607 C-669.665 214.361 -669.124 213.114 -668.582 211.867 C-668.15 210.872 -667.717 209.877 -667.284 208.881 C-663.648 200.524 -660.076 192.141 -656.569 183.729 C-655.934 182.205 -655.299 180.682 -654.663 179.159 C-654.537 178.858 -654.412 178.557 -654.282 178.247 C-654.029 177.639 -653.775 177.031 -653.521 176.423 C-653.268 175.817 -653.015 175.211 -652.763 174.606 C-649.581 166.98 -646.359 159.371 -643.133 151.764 C-642.601 150.511 -642.07 149.258 -641.539 148.004 C-640.894 146.482 -640.249 144.96 -639.603 143.438 C-639.275 142.666 -638.947 141.893 -638.62 141.12 C-636.474 136.052 -634.236 131.031 -632 126 C-588.11 125.67 -544.22 125.34 -499 125 C-484.43 101.064 -484.43 101.064 -479.199 92.462 C-470.608 78.338 -470.608 78.338 -466.938 72.375 C-466.788 72.133 -466.639 71.89 -466.485 71.64 C-464.637 68.639 -462.779 65.644 -460.916 62.651 C-459.589 60.518 -458.263 58.384 -456.938 56.25 C-456.801 56.03 -456.665 55.811 -456.524 55.584 C-451.14 46.911 -445.87 38.172 -440.64 29.405 C-435.16 20.228 -429.576 11.124 -424 2 C-399.25 2 -374.5 2 -349 2 C-335.116 35.554 -335.116 35.554 -329.775 48.986 C-328.685 51.726 -327.593 54.465 -326.5 57.203 C-326.106 58.19 -325.713 59.177 -325.319 60.163 C-325.269 60.288 -325.269 60.288 -325.019 60.916 C-324.41 62.441 -323.802 63.967 -323.193 65.493 C-320.104 73.242 -317.003 80.987 -313.897 88.731 C-298.437 127.275 -298.437 127.275 -285.158 161.027 C-284.878 161.742 -284.598 162.457 -284.318 163.172 C-279.786 174.747 -275.324 186.345 -271 198 C-268.428 193.185 -266.237 188.286 -264.215 183.215 C-264.152 183.058 -264.089 182.9 -264.025 182.738 C-263.209 180.69 -262.399 178.641 -261.59 176.59 C-260.766 174.502 -259.936 172.415 -259.106 170.329 C-259.028 170.133 -258.95 169.936 -258.869 169.733 C-258.466 168.72 -258.063 167.707 -257.659 166.693 C-257.327 165.859 -256.995 165.024 -256.663 164.19 C-252.62 154.02 -248.518 143.875 -244.412 133.731 C-243.81 132.243 -243.207 130.755 -242.605 129.267 C-242.505 129.019 -242.405 128.772 -242.302 128.517 C-242.099 128.016 -241.897 127.516 -241.694 127.015 C-241.185 125.756 -240.675 124.498 -240.166 123.239 C-240.065 122.989 -239.964 122.739 -239.859 122.481 C-239.244 120.96 -238.628 119.44 -238.013 117.919 C-235.248 111.089 -232.488 104.257 -229.731 97.424 C-222.132 78.59 -214.52 59.763 -206.814 40.973 C-206.405 39.977 -205.997 38.981 -205.589 37.985 C-200.799 26.292 -195.921 14.638 -191 3 C-190.67 2.67 -190.34 2.34 -190 2 C-175.81 2 -161.62 2 -147 2 C-150.448 13.494 -150.448 13.494 -151.907 16.891 C-152.077 17.299 -152.248 17.708 -152.418 18.117 C-152.869 19.2 -153.326 20.28 -153.784 21.36 C-154.281 22.533 -154.772 23.709 -155.263 24.885 C-156.107 26.9 -156.954 28.915 -157.803 30.928 C-159.146 34.11 -160.481 37.295 -161.815 40.481 C-162.27 41.568 -162.726 42.654 -163.181 43.741 C-163.294 44.011 -163.407 44.28 -163.523 44.559 C-164.328 46.478 -165.133 48.397 -165.938 50.316 C-169.953 59.878 -173.942 69.45 -177.914 79.03 C-178.699 80.923 -179.485 82.816 -180.272 84.708 C-185.287 96.763 -190.178 108.866 -195 121 C-194.049 120.193 -193.1 119.385 -192.152 118.575 C-191.83 118.301 -191.508 118.028 -191.186 117.754 C-188.545 115.512 -186.068 113.164 -183.656 110.674 C-180.36 107.276 -176.99 104.027 -173.386 100.959 C-170.617 98.598 -168.047 96.089 -165.5 93.49 C-162.92 90.862 -160.239 88.406 -157.441 86.012 C-153.768 82.865 -150.367 79.47 -147 76 C-146.935 75.835 -146.869 75.67 -146.802 75.5 C-141.685 62.683 -135.609 50.027 -126.348 39.638 C-125.064 38.228 -123.746 36.852 -122.414 35.487 C-121.229 34.266 -120.185 33.004 -119.161 31.644 C-114.453 25.446 -107.598 20.596 -101.139 16.38 C-89.991 9.233 -77.741 3.381 -64.858 0.213 C-63.992 -0.002 -63.128 -0.227 -62.265 -0.453 C-42.775 -5.443 -19.411 -5.3 0 0 Z " transform="translate(998,267)" />
        <path d="M0 0 C1.514 2.099 2.617 4.227 3.594 6.621 C3.742 6.978 3.891 7.335 4.04 7.692 C4.361 8.462 4.68 9.232 4.997 10.003 C5.512 11.254 6.032 12.503 6.552 13.753 C7.307 15.566 8.06 17.381 8.812 19.195 C10.746 23.865 12.693 28.529 14.64 33.193 C14.959 33.957 15.277 34.721 15.596 35.485 C19.809 45.578 24.097 55.637 28.418 65.685 C28.868 66.733 29.319 67.782 29.77 68.831 C29.859 69.04 29.949 69.249 30.042 69.464 C30.971 71.626 31.899 73.787 32.828 75.949 C33.114 76.614 33.399 77.279 33.685 77.944 C38.885 90.046 44.051 102.161 49.214 114.277 C50.109 116.375 51.003 118.473 51.899 120.571 C52.994 123.137 54.088 125.705 55.182 128.272 C55.743 129.588 56.303 130.905 56.865 132.22 C59.666 138.779 62.384 145.365 65 152 C65 152.66 65 153.32 65 154 C49.49 154 33.98 154 18 154 C13.401 144.802 13.401 144.802 11.914 141.164 C11.735 140.732 11.555 140.3 11.376 139.868 C10.891 138.702 10.41 137.534 9.93 136.365 C9.398 135.074 8.863 133.784 8.328 132.494 C7.009 129.307 5.695 126.117 4.381 122.927 C3.997 121.993 3.613 121.06 3.229 120.127 C3.164 119.971 3.1 119.815 3.034 119.654 C2.903 119.336 2.772 119.019 2.641 118.702 C0.545 113.612 -1.551 108.521 -3.645 103.43 C-8.865 90.736 -14.116 78.053 -19.375 65.375 C-19.471 65.144 -19.567 64.912 -19.666 64.674 C-22.11 58.782 -24.555 52.891 -27 47 C-25.646 40.228 -21.621 34.748 -18.062 28.875 C-17.965 28.715 -17.868 28.554 -17.768 28.389 C-8.146 12.507 -8.146 12.507 -3.438 5.25 C-3.344 5.107 -3.251 4.963 -3.155 4.815 C-2.11 3.206 -1.059 1.6 0 0 Z " transform="translate(583,366)" />
      </g>
    </svg>
  );
};

const GOOGLE_CLIENT_ID = "627799707976-gt9uudejrtd5d4b7pubkso0ev35j2rhr.apps.googleusercontent.com";
const APPLE_CLIENT_ID = "com.ayeapps.auth";

export default function AuthScreen({
  authApiUrl = 'https://api-auth.ayeapps.com',
  currentLang = 'es',
  onLangChange,
  onLoginSuccess
}) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [lang, setLang] = useState(() => currentLang || localStorage.getItem('aye_lang') || localStorage.getItem('preferred_lang') || 'es');
  const [isDark, setIsDark] = useState(true);
  const [serverStatus, setServerStatus] = useState('online');

  useEffect(() => {
    if (currentLang && currentLang !== lang) {
      setLang(currentLang);
    }
  }, [currentLang]);

  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);

  // Check server health on Central Auth API
  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch(`${authApiUrl}/health`);
        if (res.ok && mounted) setServerStatus('online');
        else if (mounted) setServerStatus('offline');
      } catch {
        if (mounted) setServerStatus('online');
      }
    };
    check();
    return () => { mounted = false; };
  }, [authApiUrl]);

  // Load remembered preferences
  useEffect(() => {
    try {
      const savedEmail = localStorage.getItem('aye_remembered_email');
      if (savedEmail) setAuthEmail(savedEmail);
      const savedLang = localStorage.getItem('preferred_lang') || localStorage.getItem('aye_lang');
      if (savedLang) setLang(savedLang);
      const savedTheme = localStorage.getItem('theme') || localStorage.getItem('aye_theme');
      if (savedTheme) setIsDark(savedTheme === 'dark');
    } catch {}
  }, []);

  const toggleLanguage = () => {
    const nextLang = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
    if (onLangChange) onLangChange(nextLang);
    try { 
      localStorage.setItem('preferred_lang', nextLang);
      localStorage.setItem('aye_lang', nextLang);
    } catch {}
  };

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    try { 
      localStorage.setItem('theme', nextDark ? 'dark' : 'light');
      localStorage.setItem('aye_theme', nextDark ? 'dark' : 'light');
    } catch {}
  };

  const handleAuth = async (e) => {
    if (e) e.preventDefault();
    const trimmedEmail = authEmail.trim();
    const trimmedPassword = authPassword.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setIsAccountNotFound(false);
      setAuthError(lang === 'es' ? 'POR FAVOR INGRESA CORREO Y CONTRASEÑA' : 'PLEASE ENTER EMAIL AND PASSWORD');
      return;
    }

    if (authMode === 'register' && trimmedPassword.length < 8) {
      setIsAccountNotFound(false);
      setAuthError(lang === 'es' ? 'LA CONTRASEÑA DEBE TENER AL MENOS 8 CARACTERES' : 'PASSWORD MUST BE AT LEAST 8 CHARACTERS');
      return;
    }

    setIsAccountNotFound(false);
    setAuthError('');
    setIsLoading(true);

    try {
      const endpoint = authMode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const payload = authMode === 'register'
        ? { name: authName.trim() || 'USUARIO AYE', email: trimmedEmail, password: trimmedPassword, app_client: 'video_downloader' }
        : { email: trimmedEmail, password: trimmedPassword, app_client: 'video_downloader' };

      const res = await fetch(`${authApiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        const errorDetail = data.detail || data.error || (lang === 'es' ? 'CREDENCIALES INCORRECTAS' : 'INVALID CREDENTIALS');
        if (authMode === 'login' && (res.status === 404 || errorDetail === 'ACCOUNT_NOT_FOUND' || errorDetail.toLowerCase().includes('not found') || errorDetail.toLowerCase().includes('no existe'))) {
          setIsAccountNotFound(true);
        }
        throw new Error(errorDetail === 'ACCOUNT_NOT_FOUND' ? (lang === 'es' ? 'LA CUENTA NO EXISTE' : 'ACCOUNT NOT FOUND') : errorDetail);
      }

      localStorage.setItem('aye_remembered_email', trimmedEmail);

      if (onLoginSuccess) {
        onLoginSuccess(data, trimmedEmail);
      }
    } catch (err) {
      setAuthError(err.message.toUpperCase());
    } finally {
      setIsLoading(false);
    }
  };

  // Google OAuth Login Trigger via Popup Window (No ambient One Tap notification)
  const handleGoogleLogin = () => {
    if (window.google?.accounts?.oauth2) {
      setAuthError('');
      setIsLoading(true);
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              setIsLoading(false);
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setAuthError((tokenResponse.error_description || tokenResponse.error).toUpperCase());
              }
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const res = await fetch(`${authApiUrl}/api/v1/auth/oauth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ access_token: tokenResponse.access_token, app_client: 'video_downloader' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Error autenticando con Google');
                if (onLoginSuccess) {
                  onLoginSuccess(data, data.user?.email || 'google_user@ayeapps.com');
                }
              } catch (err) {
                setAuthError(err.message.toUpperCase());
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        setIsLoading(false);
        setAuthError(err.message.toUpperCase());
      }
    } else {
      setAuthError(lang === 'es' ? 'SDK DE GOOGLE CARGANDO... REINTENTA EN 2 SEGUNDOS' : 'GOOGLE SDK LOADING... RETRY IN 2 SECONDS');
    }
  };

  // Apple OAuth Login
  const handleAppleLogin = async () => {
    if (window.AppleID?.auth) {
      try {
        setIsLoading(true);
        setAuthError('');
        const origin = window.location.origin;
        window.AppleID.auth.init({
          clientId: APPLE_CLIENT_ID,
          scope: 'name email',
          redirectURI: origin,
          usePopup: true,
        });
        const response = await window.AppleID.auth.signIn();
        if (response?.authorization?.id_token) {
          const res = await fetch(`${authApiUrl}/api/v1/auth/oauth/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identity_token: response.authorization.id_token,
              email: response.user?.email,
              name: response.user?.name ? `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim() : undefined,
              app_client: 'video_downloader',
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || 'Error autenticando con Apple');
          if (onLoginSuccess) {
            onLoginSuccess(data, data.user?.email || 'apple_user@ayeapps.com');
          }
        }
      } catch (err) {
        if (err.error !== 'popup_closed_by_user') {
          setAuthError((err.message || err.error || 'Error autenticando con Apple').toUpperCase());
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setAuthError(lang === 'es' ? 'SDK DE APPLE CARGANDO... REINTENTA EN 2 SEGUNDOS' : 'APPLE SDK LOADING... RETRY IN 2 SECONDS');
    }
  };

  const t = {
    es: {
      title: 'AYE-VIDEO',
      serverOnline: 'CUENTA AYE: ACTIVA',
      serverOffline: 'CUENTA AYE: DESCONECTADA',
      serverChecking: 'VERIFICANDO CUENTA...',
      login: 'INICIAR SESIÓN',
      register: 'REGISTRO',
      name: 'NOMBRE',
      email: 'CORREO ELECTRÓNICO',
      password: 'CONTRASEÑA',
      initSession: 'INICIAR SESIÓN',
      createAccount: 'CREAR CUENTA',
      processing: 'PROCESANDO...',
      accountNotFoundTitle: 'LA CUENTA NO EXISTE',
      accountNotFoundDesc: 'No existe ninguna cuenta registrada con este correo en el ecosistema.',
      suggestRegisterBtn: 'CREAR CUENTA CON ESTE CORREO ➔',
      continueWithGoogle: 'CONTINUAR CON GOOGLE',
      continueWithApple: 'CONTINUAR CON APPLE',
      orContinueWithEmail: '── O CON CORREO ──',
    },
    en: {
      title: 'AYE-VIDEO',
      serverOnline: 'AYE ACCOUNT: ACTIVE',
      serverOffline: 'AYE ACCOUNT: OFFLINE',
      serverChecking: 'CHECKING ACCOUNT...',
      login: 'SIGN IN',
      register: 'REGISTER',
      name: 'NAME',
      email: 'EMAIL ADDRESS',
      password: 'PASSWORD',
      initSession: 'INITIALIZE SESSION',
      createAccount: 'CREATE ACCOUNT',
      processing: 'PROCESSING...',
      accountNotFoundTitle: 'ACCOUNT NOT FOUND',
      accountNotFoundDesc: 'No account registered with this email address in the ecosystem.',
      suggestRegisterBtn: 'CREATE ACCOUNT WITH THIS EMAIL ➔',
      continueWithGoogle: 'CONTINUE WITH GOOGLE',
      continueWithApple: 'CONTINUE WITH APPLE',
      orContinueWithEmail: '── OR WITH EMAIL ──',
    }
  }[lang];

  return (
    <div className={`ayetasks-auth-root ${isDark ? 'dark' : 'light'}`}>
      {/* Moving Animated Dot Matrix Background */}
      <div className="ayetasks-dot-grid-animated" />

      {/* Top Right Controls (Exact clone of AyeTasks) */}
      <div className="ayetasks-top-controls">
        <button
          onClick={toggleLanguage}
          className="ayetasks-control-btn ayetasks-lang-btn"
          title="Toggle Language"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FE9D01" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span className="ayetasks-lang-text font-mono">
            {lang.toUpperCase()}
          </span>
        </button>

        <button
          onClick={toggleTheme}
          className="ayetasks-control-btn ayetasks-theme-btn"
          title="Toggle Theme"
        >
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FE9D01" strokeWidth="2.5">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
        </button>
      </div>

      {/* Centered Frame with Animated Dot Grid */}
      <div className="ayetasks-centered-view">
        <div className="ayetasks-tech-frame">
          {/* Tech Badge / Live Server Status (Exact pinned position) */}
          <div className="ayetasks-tech-badge">
            <div className={`ayetasks-status-dot ${serverStatus}`} />
            <span className="ayetasks-tech-badge-text font-mono">
              {serverStatus === 'online'
                ? t.serverOnline
                : serverStatus === 'checking'
                ? t.serverChecking
                : t.serverOffline}
            </span>
          </div>

          <div className="ayetasks-tech-frame-content">
            {/* Title Section */}
            <div className="ayetasks-title-section">
              <div className="ayetasks-auth-logo-box">
                <AyeLogo width={56} color="#FE9D01" />
              </div>
              <h1 className="ayetasks-hero-title">
                {t.title}
              </h1>
            </div>

            {/* Segmented Mode Selector */}
            <div className="ayetasks-segmented-selector">
              <button
                type="button"
                className={`ayetasks-tab-button ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => { setAuthMode('login'); setIsAccountNotFound(false); setAuthError(''); }}
              >
                <span className="ayetasks-tab-button-text">{t.login}</span>
              </button>

              <button
                type="button"
                className={`ayetasks-tab-button ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => { setAuthMode('register'); setIsAccountNotFound(false); setAuthError(''); }}
              >
                <span className="ayetasks-tab-button-text">{t.register}</span>
              </button>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleAuth} className="ayetasks-form-container">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder={t.name}
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="ayetasks-geometric-input font-mono"
                  autoComplete="name"
                  required
                />
              )}

              <input
                type="email"
                placeholder={t.email}
                value={authEmail}
                onChange={(e) => {
                  setAuthEmail(e.target.value);
                  if (isAccountNotFound) setIsAccountNotFound(false);
                }}
                className="ayetasks-geometric-input font-mono"
                autoCapitalize="none"
                autoComplete="email"
                required
              />

              <input
                type="password"
                placeholder={t.password}
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="ayetasks-geometric-input font-mono"
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                required
              />

              {/* Suggest Register Box if Account Not Found */}
              {isAccountNotFound ? (
                <div className="ayetasks-suggest-register-box">
                  <div className="ayetasks-suggest-header-row font-mono">
                    <span className="ayetasks-suggest-title">{t.accountNotFoundTitle}</span>
                  </div>
                  <p className="ayetasks-suggest-desc font-mono">{t.accountNotFoundDesc}</p>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setIsAccountNotFound(false); setAuthError(''); }}
                    className="ayetasks-suggest-btn font-mono"
                  >
                    {t.suggestRegisterBtn}
                  </button>
                </div>
              ) : authError ? (
                <div className="ayetasks-error-alert-box font-mono">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{authError}</span>
                </div>
              ) : null}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isLoading}
                className="ayetasks-hero-btn"
              >
                {isLoading ? (
                  <span>{t.processing}</span>
                ) : (
                  <span>{authMode === 'login' ? t.initSession : t.createAccount}</span>
                )}
              </button>

              {/* Divider */}
              <div className="ayetasks-divider-row">
                <div className="ayetasks-divider-line" />
                <span className="ayetasks-divider-text font-mono">{t.orContinueWithEmail}</span>
                <div className="ayetasks-divider-line" />
              </div>

              {/* Social Login Buttons */}
              <div className="ayetasks-social-container">
                {/* Google Sign In */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="ayetasks-social-btn google-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{t.continueWithGoogle}</span>
                </button>

                {/* Apple Sign In */}
                <button
                  type="button"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                  className="ayetasks-social-btn apple-btn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.85 2.76 1.01.08 2.03-.51 2.56-1.26z" />
                  </svg>
                  <span>{t.continueWithApple}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

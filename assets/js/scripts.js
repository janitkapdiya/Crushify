(function ($) {
	"use strict";

	/*********************************
	 * Browser Detecor
	 *********************************/
	// 🔒 Block Right Click
	document.addEventListener("contextmenu", function (e) {
		e.preventDefault();
		alert("Right-click is disabled.");
	});

	// 🔒 Block, Ctrl+U, Ctrl+Shift+I
	document.addEventListener("keydown", function (e) {
		// F12
		if (e.keyCode === 123) {
			alert("Developer Tools are disabled.");
			s;
			e.preventDefault();
			return false;
		}
		//Ctrl + U;
		if (e.ctrlKey && e.key.toLowerCase() === "u") {
			// Wipe the content completely
			document.body.innerHTML = "<h1 style='color:red; text-align:center;'>❌ Source code access is blocked.</h1>";
			e.preventDefault();
			return false;
		}

		// Ctrl+Shift+I or Cmd+Opt+I (Mac)
		if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i") {
			alert("Inspect is disabled.");
			e.preventDefault();
			return false;
		}
	});

	/*********************************
	 * Sticky Navbar
	 *********************************/
	$(window).on("scroll", function () {
		const scrolling = $(this).scrollTop();
		const header = $(".header");

		if (scrolling >= 10) {
			header.addClass("nav-bg");
		} else {
			header.removeClass("nav-bg");
		}
	});

	/*********************************
	 * Toggle Mobile Menu
	 *********************************/
	$(".header__toggle").on("click", function (e) {
		e.preventDefault();
		$(this).toggleClass("active");
		$(".header__menu").toggleClass("mblMenu__open");
	});

	$(".header .header__menu ul li a").on("click", function () {
		$(".header__toggle").removeClass("active");
		$(".header__menu").removeClass("mblMenu__open");
	});

	/*********************************
	 * Smooth Scroll
	 *********************************/
	$(".header .header__menu ul li a").on("click", function (e) {
		const target = this.hash;
		const $target = $(target);

		if ($target.length) {
			e.preventDefault();
			$("html, body")
				.stop()
				.animate(
					{
						scrollTop: $target.offset().top - 150,
					},
					100,
					"swing",
					function () {
						window.location.hash = target;
					}
				);
		}
	});

	/*********************************
	 * Language Dropdown
	 *********************************/
	$(".language__dropdown .selected").on("click", function (e) {
		e.preventDefault();
		$(".dropdown__list").toggleClass("active");
	});

	$(document).on("click", function (e) {
		if (!$(e.target).closest(".meta__list").length && !$(e.target).closest(".language__dropdown").length) {
			$(".dropdown__list").removeClass("active");
		}
	});

	/*********************************
	 * AOS Animation
	 *********************************/
	AOS.init();

	/*********************************
	 * Image Converter Logic
	 *********************************/
	// ========== Global Variables ==========
	let selectedFormat = "";
	let selectedExtension = "";
	let files = [];

	// ========== DOM Elements ==========
	const uploadArea = document.getElementById("uploadArea");
	const fileInput = document.getElementById("fileInput");
	const widthInput = document.getElementById("widthInput");
	const heightInput = document.getElementById("heightInput");
	const resizeLabel = document.querySelector(".resize .info__title span");

	// ========== Drag & Drop Upload ==========
	uploadArea.addEventListener("click", () => fileInput.click());

	uploadArea.addEventListener("dragover", (e) => {
		e.preventDefault();
		uploadArea.classList.add("dragover");
	});

	uploadArea.addEventListener("dragleave", () => {
		uploadArea.classList.remove("dragover");
	});

	uploadArea.addEventListener("drop", (e) => {
		e.preventDefault();
		uploadArea.classList.remove("dragover");

		const droppedFiles = [...e.dataTransfer.files].filter((f) => f.type.startsWith("image/"));
		files.push(...droppedFiles);
		updateFileList();
		showPreview();
	});

	// ========== File Input Upload ==========
	fileInput.setAttribute("accept", "image/*,.heic,.HEIC");
	fileInput.addEventListener("change", async (e) => {
		let selectedFiles = [...e.target.files];
		const processedFiles = await Promise.all(selectedFiles.map(async (file) => {
			if ((file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic"))) {
				if (typeof heic2any !== "undefined") {
					try {
						const convertedBlob = await heic2any({
							blob: file,
							toType: "image/jpeg",
							quality: 0.8
						});
						const outBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
						const jpegFile = new File([outBlob], file.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });

						// Remove the HEIC converted message and download button
						// const msg = '<div class="alert alert-success" style="margin-top:10px;">HEIC converted! <span id="heic-download-btn"></span></div>';
						// if (document.getElementById('uploadMessage')) {
						//     document.getElementById('uploadMessage').innerHTML = msg;
						//     document.getElementById('heic-download-btn').appendChild(downloadLink);
						// }

						return jpegFile;
					} catch (err) {
						const msg = '<div class="alert alert-danger" style="margin-top:10px;">HEIC conversion failed in the browser. Try a different file or use a desktop converter.</div>';
						if (document.getElementById('uploadMessage')) {
							document.getElementById('uploadMessage').innerHTML = msg;
						}
						return null;
					}
				}
				const msg = '<div class="alert alert-danger" style="margin-top:10px;">HEIC conversion is not supported in this browser. Please use a desktop converter or another online tool.</div>';
				if (document.getElementById('uploadMessage')) {
					document.getElementById('uploadMessage').innerHTML = msg;
				}
				return null;
			}
			return file;
		}));
		files.push(...processedFiles.filter(Boolean).filter((f) => f.type.startsWith("image/")));
		updateFileList();
		showPreview();
	});

	// ========== Format Button Selection ==========
	document.querySelectorAll(".select__btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			// Remove active class from all buttons
			document.querySelectorAll(".select__btn").forEach((b) => b.classList.remove("active"));
			// Add to clicked one
			btn.classList.add("active");

			// Set selected format and extension
			selectedFormat = btn.dataset.format;
			selectedExtension = btn.dataset.extension || selectedFormat;

			// If compress mode, update UI
			if (selectedFormat === "compress") {
				document.querySelector(".quality").style.display = "block";
				document.querySelector(".resize").style.display = "none";
			} else {
				document.querySelector(".quality").style.display = "block";
				document.querySelector(".resize").style.display = "block";
			}
		});
	});

	// ========== Quality Slider ==========
	document.getElementById("qualitySlider").addEventListener("input", function () {
		document.getElementById("qualityValue").textContent = `${this.value}%`;
	});

	// ========== Resize Label Update ==========
	function updateResizeLabel() {
		const w = widthInput.value || 0;
		const h = heightInput.value || 0;
		resizeLabel.textContent = `${w}px * ${h}px`;
	}

	widthInput.addEventListener("input", updateResizeLabel);
	heightInput.removeAttribute("disabled");
	heightInput.addEventListener("input", updateResizeLabel);

	// ========== File List Display ==========
	function updateFileList() {
		const fileList = document.getElementById("fileList");
		fileList.innerHTML = "";

		files.forEach((file, index) => {
			const li = document.createElement("li");

			const displaySize =
				file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(2)} KB` : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

			li.innerHTML = `<i class="fi fi-rr-picture"></i> ${file.name} - <span>${displaySize}</span>`;

			const deleteBtn = document.createElement("button");
			deleteBtn.textContent = "✕";
			deleteBtn.addEventListener("click", () => {
				files.splice(index, 1);
				updateFileList();
				showPreview();
			});

			li.appendChild(deleteBtn);
			fileList.appendChild(li);
		});
	}

	// ========== Image Preview ==========
	function showPreview() {
		const preview = document.getElementById("preview");
		preview.innerHTML = "";

		files.forEach((file) => {
			const wrapper = document.createElement("div");
			wrapper.className = "image__card";

			const img = document.createElement("img");
			img.src = URL.createObjectURL(file);

			const fileInfo = document.createElement("p");
			fileInfo.innerHTML = `${file.name} <span class='filesize'>(Original: ${formatFileSize(file.size)})</span>`;

			wrapper.appendChild(img);
			wrapper.appendChild(fileInfo);
			preview.appendChild(wrapper);
		});
	}

	// ========== Format File Size ==========
	function formatFileSize(sizeInBytes) {
		const sizeInKB = sizeInBytes / 1024;
		return sizeInKB < 1024 ? `${sizeInKB.toFixed(2)} KB` : `${(sizeInKB / 1024).toFixed(2)} MB`;
	}

	// ========== Convert Images ==========
	document.getElementById("convertBtn").addEventListener("click", async () => {
		if (!selectedFormat) {
			alert("Please select a conversion format.");
			return;
		}

		document.getElementById("fullPageLoader").style.display = "flex";

		let quality = parseInt(document.getElementById("qualitySlider").value) / 100;
		if (selectedFormat === "compress") {
			// For PNG, set a more aggressive default quality
			const isPNG = files.length > 0 && files[0].type === "image/png";
			if (isPNG && document.getElementById("qualitySlider").value == document.getElementById("qualitySlider").defaultValue) {
				quality = 0.4;
				document.getElementById("qualitySlider").value = 40;
				document.getElementById("qualityValue").textContent = "40%";
			} else if (document.getElementById("qualitySlider").value == document.getElementById("qualitySlider").defaultValue) {
				quality = 0.65;
				document.getElementById("qualitySlider").value = 65;
				document.getElementById("qualityValue").textContent = "65%";
			}
		}
		const width = parseInt(widthInput.value);
		const height = parseInt(heightInput.value);
		const shouldResize = !isNaN(width) && width > 0 && !isNaN(height) && height > 0;

		const preview = document.getElementById("preview");
		preview.innerHTML = "";

		const convertedFiles = [];

		try {
			for (const file of files) {
				let options;
				let outFormat = selectedFormat;
				let outExtension = selectedExtension;
				let fileType = file.type;
				if (selectedFormat === "compress") {
					// Only compress, keep original format
					outFormat = fileType.split("/")[1];
					outExtension = outFormat === "jpeg" ? "jpg" : outFormat;
					options = {
						useWebWorker: true,
						initialQuality: quality,
						fileType: fileType,
					};
					// If PNG and still large after compression, convert to JPEG for much smaller size
					if (fileType === "image/png") {
						// Try compressing as JPEG if user wants smaller size
						const tempCompressed = await imageCompression(file, options);
						if (tempCompressed.size > 1024 * 1024) { // >1MB
							// Try JPEG
							const jpegOptions = {
								useWebWorker: true,
								initialQuality: quality,
								fileType: "image/jpeg",
							};
							const jpegCompressed = await imageCompression(file, jpegOptions);
							if (jpegCompressed.size < tempCompressed.size) {
								convertedFiles.push({
									file: jpegCompressed,
									originalName: file.name,
									originalSize: file.size,
									outExtension: "jpg",
							});
							continue;
							} else {
								convertedFiles.push({
									file: tempCompressed,
									originalName: file.name,
									originalSize: file.size,
									outExtension,
							});
							continue;
							}
						} else {
							convertedFiles.push({
								file: tempCompressed,
								originalName: file.name,
								originalSize: file.size,
								outExtension,
							});
							continue;
						}
					}
				} else {
					// Convert and compress
					options = {
						useWebWorker: true,
						initialQuality: quality,
						fileType: `image/${selectedFormat}`,
						...(shouldResize ? { maxWidth: width, maxHeight: height } : {}),
					};
				}

				const compressed = await imageCompression(file, options);
				convertedFiles.push({
					file: compressed,
					originalName: file.name,
					originalSize: file.size,
					outExtension,
				});
			}

			for (const [i, obj] of convertedFiles.entries()) {
				const file = obj.file;
				const imgURL = URL.createObjectURL(file);
				const wrapper = document.createElement("div");
				wrapper.className = "image__card";

				const img = document.createElement("img");
				img.src = imgURL;

				const fileInfo = document.createElement("p");
				fileInfo.innerHTML = `${obj.originalName.replace(/\.[^.]+$/, '')}.${obj.outExtension} <span class="filesize">(Original: ${formatFileSize(obj.originalSize)}, Compressed: ${formatFileSize(file.size)})</span>`;

				const downloadBtn = document.createElement("a");
				downloadBtn.href = imgURL;
				downloadBtn.download = `${obj.originalName.replace(/\.[^.]+$/, '')}.${obj.outExtension}`;
				downloadBtn.innerHTML = '<i class="fi fi-rr-download"></i> Download';
				downloadBtn.className = "download-btn";

				wrapper.appendChild(img);
				wrapper.appendChild(fileInfo);
				wrapper.appendChild(downloadBtn);
				preview.appendChild(wrapper);
			}

			// Update files array to new compressed files for further actions
			files = convertedFiles.map(obj => {
				const f = obj.file;
				f._originalName = obj.originalName;
				f._outExtension = obj.outExtension;
				return f;
			});
			updateFileList();
		} catch (error) {
			alert("Error during conversion. Please try again.");
			console.error(error);
		} finally {
			document.getElementById("fullPageLoader").style.display = "none";
		}
	});

	// ========== Download All as ZIP ==========
	document.getElementById("downloadZip").addEventListener("click", async () => {
		if (files.length === 0) {
			alert("No images to download.");
			return;
		}

		const zip = new JSZip();

		for (const [i, file] of files.entries()) {
			const blob = await file.arrayBuffer();
			const name = file._originalName ? file._originalName.replace(/\.[^.]+$/, '') : `image${i + 1}`;
			const ext = file._outExtension || selectedExtension;
			zip.file(`${name}.${ext}`, blob);
		}

		zip.generateAsync({ type: "blob" }).then((content) => {
			saveAs(content, "compressed_images.zip");
		});
	});

	// ========== Clear All ==========
	document.getElementById("clearAll").addEventListener("click", () => {
		files = [];
		document.getElementById("preview").innerHTML = "";
		document.getElementById("fileInput").value = "";
		document.getElementById("fileList").innerHTML = "";
		widthInput.value = "";
		heightInput.value = "";
		updateResizeLabel();
	});

	// Add a container for error/info messages below the upload area
	$(document).ready(function() {
		if (!document.getElementById('uploadMessage')) {
			$('#uploadArea').after('<div id="uploadMessage" style="margin-top:10px;"></div>');
		}
	});
})(jQuery);

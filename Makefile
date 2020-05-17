.PHONY: all copy images clean

SRC_DIR = ./src
SRC_IMG = ./assets
BUILD_DIR = ./build
EXT_DIR = $(BUILD_DIR)/ext
BUILD_IMAGES = $(BUILD_DIR)/images

all: clean copy
	cd $(EXT_DIR); zip -r ../flash-cardon.zip *; cd ..

copy: images
	mkdir -p $(EXT_DIR)
	cp -r $(SRC_DIR)/* $(EXT_DIR)
	cp -r $(BUILD_IMAGES)/* $(EXT_DIR)

images:
	mkdir -p $(BUILD_IMAGES)
	$(foreach size, 16 19 48 128, \
		inkscape $(SRC_IMG)/icon.svg -w $(size) -h $(size) --export-png=$(BUILD_IMAGES)/icon_$(size).png ; \
	)

clean:
	rm -rf $(BUILD_DIR)/*
.PHONY: all copy clean

SRC_DIR = ./src
SRC_IMG = ./assets
BUILD_DIR = ./build
EXT_DIR = $(BUILD_DIR)/ext
BUILD_IMAGES = $(BUILD_DIR)/images
VERSION := $(shell jq -r .version $(SRC_DIR)/manifest.json)

resolutions := 16 19 48 128
all_ICONS := $(foreach resolution, $(resolutions), $(BUILD_IMAGES)/icon_$(resolution).png)

all: copy
	cd $(EXT_DIR); zip -r ../flash-cardon-$(VERSION).zip *; cd ..

copy: $(EXT_DIR) images
	cp -r $(SRC_DIR)/* $(EXT_DIR)
	cp -r $(BUILD_IMAGES)/* $(EXT_DIR)

$(EXT_DIR):
	mkdir -p $(EXT_DIR)

images: $(BUILD_IMAGES) $(all_ICONS)

$(BUILD_IMAGES):
	mkdir -p $(BUILD_IMAGES)

$(BUILD_IMAGES)/icon_%.png: $(SRC_IMG)/icon.svg
	inkscape $(SRC_IMG)/icon.svg -w $* -h $* --export-png=$@

clean_images:
	rm -rf $(BUILD_IMAGES)/*

clean_copy:
	rm -rf $(EXT_DIR)/*

clean: clean_images, clean_copy
	rm -rf $(BUILD_DIR)/*
PKGARCH=amd64
AWS_FLAVOR=t3.nano
AWS_REGION=eu-west-2
AWS_BUCKET_NAME=nano-test-bucket
IMAGE_DIR=./build
IMAGE_NAME=blit-web-$(PKGARCH)-$(shell date +"%Y-%m-%dT%H%M")

clean:
	rm -rf $(IMAGE_DIR)

install:
	pnpm install

build: install
	pnpm run build

image-dir:
	mkdir -p $(IMAGE_DIR)

image-copy-assets: image-dir build
	rm -rf $(IMAGE_DIR)/public
	cp -r ./dist $(IMAGE_DIR)/public

image-create-config: image-dir 
	AWS_REGION=$(AWS_REGION) AWS_BUCKET_NAME=$(AWS_BUCKET_NAME) PKGARCH=$(PKGARCH) AWS_FLAVOR=$(AWS_FLAVOR) ./scripts/image-make-config.sh > $(IMAGE_DIR)/config.json

image-create: image-create-config image-copy-assets
	cd $(IMAGE_DIR); ops image create -c config.json --package radiosilence/nano-web:latest --arch $(PKGARCH) -i $(IMAGE_NAME)

image-create-aws: image-create-config image-copy-assets
	ops image delete -t aws -z $(AWS_REGION) $(IMAGE_NAME) --assume-yes
	cd $(IMAGE_DIR); ops image create -t aws -c config.json --package radiosilence/nano-web:latest --arch $(PKGARCH) -i $(IMAGE_NAME)

instance-create-aws: image-create-aws
	ops instance create -t aws -z eu-west-2 blit-web --port 80 
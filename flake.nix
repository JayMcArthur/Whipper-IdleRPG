{
  description = "Locked Whipper wiki build and browser environment";
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/78e9c786dc08cd4f3420c2395cd977206a9b1da2";
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = import nixpkgs { inherit system; };
    in {
      devShells.${system} = {
        default = pkgs.mkShell { packages = [ pkgs.nodejs_24 ]; };
        browser = pkgs.mkShell {
          packages = [ pkgs.nodejs_24 pkgs.chromium ];
          PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH = "${pkgs.chromium}/bin/chromium";
        };
      };
    };
}

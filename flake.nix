{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
    flake-utils.url = "github:numtide/flake-utils";
    gitignore = {
      url = "github:hercules-ci/gitignore.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    gitignore,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        packageJSON = pkgs.lib.importJSON ./package.json;
        gitignoreSource = gitignore.lib.gitignoreSource;
      in rec {
        packages = rec {
          yarnOfflineCache = pkgs.fetchYarnDeps {
            yarnLock = ./yarn.lock;
            hash = "sha256-f42j83cXztTOXKkDTYEN//doYxDrlZjQDuYZ5O9P/4A=";
          };

          site-src = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "${packageJSON.name}-site";
            version = packageJSON.version;
            src = gitignoreSource ./.;

            nativeBuildInputs = [
              pkgs.yarnConfigHook
              pkgs.yarnBuildHook
              pkgs.nodejs
            ];

            inherit yarnOfflineCache;

            installPhase = ''
              runHook preInstall
              mkdir -p $out
              cp -r build $out/build
              runHook postInstall
            '';
          });

          default = pkgs.writeShellApplication {
            name = packageJSON.name;
            runtimeInputs = [site-src pkgs.nodejs];
            text = ''
              node ${site-src}/build
            '';
          };
        };

        devShell = pkgs.mkShell {
          buildInputs = [pkgs.yarn pkgs.nodejs pkgs.typescript-language-server];
          shellHook = ''
            export PATH=$PATH:$(pwd)/node_modules/.bin/
          '';
        };
      }
    );
}

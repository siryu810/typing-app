{
  description = "Reply Day development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

  outputs =
    { nixpkgs, ... }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAll = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAll (
        system:
        let
          pkgs = nixpkgs.legacyPackages.${system};
        in
        {
          default = pkgs.mkShell {
            packages = [
              pkgs.just
              pkgs.wrangler
              pkgs.direnv
            ];
            shellHook = ''
              export PATH="$HOME/.local/share/vite-plus/bin:$PATH"
              if ! command -v vp >/dev/null 2>&1; then
                echo "vp が見つかりません。 curl -fsSL https://vite.plus | bash を実行してください。"
              fi
            '';
          };
        }
      );
    };
}

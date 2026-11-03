# `cicd`

> Reusable GitHub Actions workflows for Rust crate repositories.

`.github/workflows/` holds two reusable workflows, `crate_ci.yml` for building, testing and releasing a crate, with options for publishing to crates.io and bumping the version automatically, and `crate_audit.yml` for auditing one. A crate repository calls them from its own workflows, and `templates/rust_crate_repo/` has a `main.yml` for pushes to `main` and a `pr.yml` for pull requests to start from.

```yaml
jobs:
  call_crate_cicd:
    uses: orgrinrt/cicd/.github/workflows/crate_ci.yml@main
    secrets:
      CRATES_IO_TOKEN: ${{ secrets.CRATES_IO_TOKEN }}
      GH_RELEASE_TOKEN: ${{ secrets.GH_RELEASE_TOKEN }}
    with:
      toolchain: 'stable'
      deploy_cratesio: true
      auto_bump: true
```

It is a work in progress, and the inputs shown are the ones the template passes.

## License

The project is licensed under the MIT License, see [LICENSE](LICENSE).

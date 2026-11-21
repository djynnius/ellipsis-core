def test_home_page_renders(client):
    response = client.get("/")
    assert response.status_code == 200
    body = response.get_data(as_text=True)
    assert "scripts/skeleton.js" in body
    assert 'id="page-skeleton"' in body


def test_status_reports_database_and_disabled_redis(client):
    response = client.get("/api/status")
    assert response.get_json() == {"database": True, "redis": None}


def test_unknown_page_uses_the_404_view(client):
    response = client.get("/nope")
    assert response.status_code == 404
    assert "Page not found" in response.get_data(as_text=True)


def test_assets_are_served_from_the_assets_folder(client):
    for path in ("/assets/scripts/skeleton.js", "/assets/css/skeleton.css", "/assets/scripts/vendor/vue.global.prod.js"):
        assert client.get(path).status_code == 200, path


def test_storage_folders_are_configured(app):
    assert app.config["UPLOAD_FOLDER"].endswith("uploads")
    assert app.config["DOWNLOAD_FOLDER"].endswith("downloads")
    assert app.config["MAX_CONTENT_LENGTH"] == 16 * 1024 * 1024

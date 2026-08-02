import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.climatetrace_service import ClimateTraceService

def test_clean_company_name():
    service = ClimateTraceService()
    assert service._clean_company_name("Microsoft Corporation") == "microsoft"
    assert service._clean_company_name("Shell PLC") == "shell"
    assert service._clean_company_name("BP Co.") == "bp"
    assert service._clean_company_name("Tata Steel Limited") == "tata steel"

@pytest.mark.asyncio
async def test_climatetrace_search_company():
    service = ClimateTraceService()
    
    # Mock Response object
    mock_res = MagicMock()
    mock_res.status_code = 200
    mock_res.json.return_value = [{"id": "E123", "name": "Microsoft Ireland Operations Ltd"}]
    
    with patch("httpx.AsyncClient.get", return_value=mock_res) as mock_get:
        async with httpx.AsyncClient() as client:
            res = await service.search_company(client, "Microsoft Corporation")
            assert res is not None
            assert res["id"] == "E123"
            assert res["name"] == "Microsoft Ireland Operations Ltd"
            
            mock_get.assert_called_once()
            called_params = mock_get.call_args[1].get("params")
            assert called_params is not None
            assert called_params["name"] == "Microsoft Corporation"

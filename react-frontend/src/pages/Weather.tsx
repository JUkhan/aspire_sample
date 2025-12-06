import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { weatherApi } from '../services/api';
import type { WeatherForecast } from '../types';

export default function Weather() {
  const { isAuthenticated } = useAuth();
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const data = await weatherApi.getForecasts();
        setForecasts(data);
      } catch (err) {
        setError('Failed to load weather data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="auth-required">
        <h2>Authentication Required</h2>
        <p>Please <Link to="/login">login</Link> to view weather data.</p>
      </div>
    );
  }

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="weather">
      <h1>Weather Forecast</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Temp (C)</th>
            <th>Temp (F)</th>
            <th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {forecasts.map((forecast, index) => (
            <tr key={index}>
              <td>{new Date(forecast.date).toLocaleDateString()}</td>
              <td>{forecast.temperatureC}</td>
              <td>{forecast.temperatureF}</td>
              <td>{forecast.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

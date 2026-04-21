# Bugfix Requirements Document

## Introduction

This document addresses a bug where anime (الأنمي) items in the application do not display their file size, and the size is not calculated as part of the total storage when sending selections via WhatsApp. The root cause has been identified: anime entries in the data file lack the `size` field that is present in other content types (movies, TV shows).

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an anime item is displayed in the MovieCard component THEN the size badge is not shown because the `size` field is missing from the data

1.2 WHEN an anime item is viewed in the MovieDetailsModal THEN the size information is not displayed because the `size` field is missing from the data

1.3 WHEN selected items are sent via WhatsApp using useMovieSelection hook THEN the anime size is not included in the total size calculation because the `size` field is missing from the data

### Expected Behavior (Correct)

2.1 WHEN an anime item is displayed in the MovieCard component THEN the system SHALL show the size badge with the anime's file size

2.2 WHEN an anime item is viewed in the MovieDetailsModal THEN the system SHALL display the size information in the details grid

2.3 WHEN selected items are sent via WhatsApp THEN the system SHALL include the anime size in the item description and calculate it within the total storage

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a movie item is displayed THEN the system SHALL CONTINUE TO show the size badge if the `size` field is present

3.2 WHEN a TV show item is displayed THEN the system SHALL CONTINUE TO show the size badge if the `size` field is present

3.3 WHEN the MovieCard or MovieDetailsModal components render items without a `size` field THEN the system SHALL CONTINUE TO gracefully hide the size display without errors

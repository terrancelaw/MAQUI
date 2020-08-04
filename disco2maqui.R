library(tidyverse)
library(here)

disco <- read_csv(here("data", "disco-data.csv"))

disco %>%
  select(ID = CaseID, time = Timestamp, Activity) %>%
  # Replace `=` with `:` because the equals symbol causes MAQUI to display 0
  # journeys.
  mutate(Activity = str_replace_all(Activity, fixed("="), ":")) %>%
  write_csv(here("data", "events.csv"))

disco %>%
  distinct(CaseID, isMobile, type) %>%
  rename(ID = CaseID) %>%
  write_csv(here("data", "recordAttributes.csv"))

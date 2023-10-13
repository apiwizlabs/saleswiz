

export const generateYears = () => {
    const date = new Date();
    const currentYear = date.getFullYear();
    let yearOptions = []
    for(let i = parseInt(currentYear) + 10; i >= 2000 ; i-- ){
        const item = i.toString()
        yearOptions.push({label: item, value: item})
    }
    return yearOptions
}

export const yearOptions = [
    { "label": "2023", "value": "2023" },
    { "label": "2022", "value": "2022" },
    { "label": "2021", "value": "2021" },
    { "label": "2020", "value": "2020" },
    { "label": "2019", "value": "2019" },
    { "label": "2018", "value": "2018" },
    { "label": "2017", "value": "2017" },
    { "label": "2016", "value": "2016" },
    { "label": "2015", "value": "2015" },
    { "label": "2014", "value": "2014" },
    { "label": "2013", "value": "2013" },
    { "label": "2012", "value": "2012" },
    { "label": "2011", "value": "2011" },
    { "label": "2010", "value": "2010" },
    { "label": "2009", "value": "2009" },
    { "label": "2008", "value": "2008" },
    { "label": "2007", "value": "2007" },
    { "label": "2006", "value": "2006" },
    { "label": "2005", "value": "2005" },
    { "label": "2004", "value": "2004" },
    { "label": "2003", "value": "2003" },
    { "label": "2002", "value": "2002" },
    { "label": "2001", "value": "2001" },
    { "label": "2000", "value": "2000" }
  ]
  

import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import "../Workorder/active.scss"
import { json, useNavigate } from 'react-router-dom';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import HandymanIcon from '@mui/icons-material/Handyman';
import { AppBar, Toolbar, Typography, Grid, Box, Button, IconButton, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, Snackbar, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Collapse, Switch, FormControlLabel } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CloseIcon from '@mui/icons-material/Close';

// import IconButton from '@mui/material/IconButton';
// import MenuIcon from '@mui/icons-material/Menu';
export const PrintStation = () => {
  const navigate = useNavigate();

  //We'll need some authentication for this page


  const [workOrder, setWorkOrder] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [printers, setPrinters] = React.useState([]);
  const [selectedPrinters, setSelectedPrinters] = React.useState({});
  const [printingStatus, setPrintingStatus] = React.useState({});
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [passwordDialog, setPasswordDialog] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');
  const [confirmDialog, setConfirmDialog] = React.useState({ open: false, type: '', woId: null, count: 0 });
  const [selectionDialog, setSelectionDialog] = React.useState({ open: false, type: '', woId: null, workOrder: null });
  const [availableLabels, setAvailableLabels] = React.useState([]);
  const [selectedLabels, setSelectedLabels] = React.useState([]);
  const [filterPrinted, setFilterPrinted] = React.useState('all'); // 'all', 'printed', 'unprinted'
  const [expandedAccordion, setExpandedAccordion] = React.useState(null);
  const [searchText, setSearchText] = React.useState('');
  const [sortBy, setSortBy] = React.useState('name'); // 'name', 'date', 'status'
  const [loadingLabels, setLoadingLabels] = React.useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage, setItemsPerPage] = React.useState(25);
  
  // Manager mode - search for work orders including closed
  const [workOrderSearch, setWorkOrderSearch] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  
  // Store global default printers from database
  const [defaultPrinters, setDefaultPrinters] = React.useState({ tray: null, cabinet: null, pallet: null });

  const handleAccordionChange = (woId) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? woId : null);
  };

  async function handleLabelClick(val, forceReprint = false) {
    console.log("handleLabelClick called with value: " + JSON.stringify(val));

    const selectedPrinter = selectedPrinters[val['wo_id']]?.tray;
    if (!selectedPrinter) {
      setSnackbar({ open: true, message: 'Please select a printer for Tray Labels', severity: 'error' });
      return;
    }

    const printKey = `${val['wo_id']}_tray`;
    setPrintingStatus(prev => ({ ...prev, [printKey]: true }));

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/print_wo/` + val['wo_id'], {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printer_name: selectedPrinter,
          is_supervisor: forceReprint || isUnlocked
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        setSnackbar({ open: true, message: `Sent ${data.printed} tray label(s) to printer successfully!`, severity: 'success' });
      } else if (data.already_printed) {
        setSnackbar({ open: true, message: data.message, severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to print tray labels', severity: 'error' });
      }
    } catch (error) {
      console.error('Print error:', error);
      setSnackbar({ open: true, message: 'Error sending to printer', severity: 'error' });
    } finally {
      setPrintingStatus(prev => ({ ...prev, [printKey]: false }));
    }
  }



  async function handleCabinetClick(val, forceReprint = false) {
    console.log("handleCabinetClick called");

    const selectedPrinter = selectedPrinters[val['wo_id']]?.cabinet;
    if (!selectedPrinter) {
      setSnackbar({ open: true, message: 'Please select a printer for Cabinet Labels', severity: 'error' });
      return;
    }

    const printKey = `${val['wo_id']}_cabinet`;
    setPrintingStatus(prev => ({ ...prev, [printKey]: true }));

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/print_cabinetlabel/` + val['wo_id'], {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printer_name: selectedPrinter,
          is_supervisor: forceReprint || isUnlocked
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        setSnackbar({ open: true, message: `Sent ${data.printed} cabinet label(s) to printer successfully!`, severity: 'success' });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to print cabinet labels', severity: 'error' });
      }
    } catch (error) {
      console.error('Print error:', error);
      setSnackbar({ open: true, message: 'Error sending to printer', severity: 'error' });
    } finally {
      setPrintingStatus(prev => ({ ...prev, [printKey]: false }));
    }
  }

  async function handlePalletClick(val, forceReprint = false) {
    console.log("handlePalletClick called");

    const selectedPrinter = selectedPrinters[val['wo_id']]?.pallet;
    if (!selectedPrinter) {
      setSnackbar({ open: true, message: 'Please select a printer for Pallet Labels', severity: 'error' });
      return;
    }

    const printKey = `${val['wo_id']}_pallet`;
    setPrintingStatus(prev => ({ ...prev, [printKey]: true }));

    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/print_palletlabel/` + val['wo_id'], {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          printer_name: selectedPrinter,
          is_supervisor: forceReprint || isUnlocked
        })
      });

      const data = await response.json();

      if (response.status === 200) {
        setSnackbar({ open: true, message: `Sent ${data.printed} pallet label(s) to printer successfully!`, severity: 'success' });
      } else if (data.already_printed) {
        setSnackbar({ open: true, message: data.message, severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to print pallet labels', severity: 'error' });
      }
    } catch (error) {
      console.error('Print error:', error);
      setSnackbar({ open: true, message: 'Error sending to printer', severity: 'error' });
    } finally {
      setPrintingStatus(prev => ({ ...prev, [printKey]: false }));
    }
  }

  const bearer = localStorage.getItem('data')
  
  // Load default printers from database on component mount
  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/default_printers`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === 1 && data.data) {
          // Store the global defaults
          setDefaultPrinters({
            tray: data.data.tray || null,
            cabinet: data.data.cabinet || null,
            pallet: data.data.pallet || null
          });
        }
      })
      .catch((error) => console.log('Error fetching default printers:', error));
  }, []);

  // Apply default printers to incomplete work orders when they load
  React.useEffect(() => {
    if (workOrder.length === 0 || (!defaultPrinters.tray && !defaultPrinters.cabinet && !defaultPrinters.pallet)) return;

    const defaults = { ...selectedPrinters };
    workOrder.forEach(wo => {
      if (!defaults[wo.wo_id]) {
        defaults[wo.wo_id] = {
          tray: defaultPrinters.tray,
          cabinet: defaultPrinters.cabinet,
          pallet: defaultPrinters.pallet
        };
      }
    });
    setSelectedPrinters(defaults);
  }, [workOrder, defaultPrinters]);

  // Apply default printers to search results when they load
  React.useEffect(() => {
    if (searchResults.length === 0 || (!defaultPrinters.tray && !defaultPrinters.cabinet && !defaultPrinters.pallet)) return;

    const defaults = { ...selectedPrinters };
    searchResults.forEach(wo => {
      if (!defaults[wo.wo_id]) {
        defaults[wo.wo_id] = {
          tray: defaultPrinters.tray,
          cabinet: defaultPrinters.cabinet,
          pallet: defaultPrinters.pallet
        };
      }
    });
    setSelectedPrinters(defaults);
  }, [searchResults, defaultPrinters]);

  // Fetch printers on component mount
  React.useEffect(() => {
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getPrinters`, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success === 1) {
          setPrinters(data.data);
        }
      })
      .catch((error) => console.log('Error fetching printers:', error));
  }, []);

  // Handle handyman icon click
  const handleUnlockClick = () => {
    if (isUnlocked) {
      // Lock it back
      setIsUnlocked(false);
      setSnackbar({ open: true, message: 'Printer settings locked', severity: 'info' });
    } else {
      // Ask for password
      setPasswordDialog(true);
    }
  };

  const handlePasswordSubmit = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/passwordCheckPrintStation/${passwordInput}`, {
        method: "GET"
      });
      const data = await response.json();
      
      if (data.success) {
        setIsUnlocked(true);
        setPasswordDialog(false);
        setPasswordInput('');
        setSnackbar({ open: true, message: 'Supervisor access granted', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Incorrect password', severity: 'error' });
        setPasswordInput('');
      }
    } catch (error) {
      console.error('Password check error:', error);
      setSnackbar({ open: true, message: 'Error validating password', severity: 'error' });
      setPasswordInput('');
    }
  };

  const handleOpenSelection = async (type, wo) => {
    if (!isUnlocked) {
      setSnackbar({ open: true, message: 'Supervisor access required to select specific labels', severity: 'warning' });
      return;
    }

    const endpointMap = {
      tray: `get_tray_labels_for_selection/${wo.wo_id}`,
      pallet: `get_pallet_labels_for_selection/${wo.wo_id}`,
      cabinet: `get_cabinet_labels_for_selection/${wo.wo_id}`
    };

    setLoadingLabels(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/${endpointMap[type]}`, {
        method: "GET"
      });
      const data = await response.json();
      
      if (data.success) {
        setAvailableLabels(data.data);
        setSelectedLabels([]);
        setFilterPrinted('all'); // Show all by default
        setSearchText('');
        setSortBy('name');
        setLastSelectedIndex(null);
        setCurrentPage(1);
        setSelectionDialog({ open: true, type, woId: wo.wo_id, workOrder: wo });
      } else {
        setSnackbar({ open: true, message: 'Failed to fetch labels', severity: 'error' });
      }
    } catch (error) {
      console.error('Fetch labels error:', error);
      setSnackbar({ open: true, message: 'Error fetching labels', severity: 'error' });
    } finally {
      setLoadingLabels(false);
    }
  };

  const handlePrintSelected = async () => {
    if (selectedLabels.length === 0) {
      setSnackbar({ open: true, message: 'Please select at least one label', severity: 'warning' });
      return;
    }

    const { type, woId, workOrder } = selectionDialog;
    const selectedPrinter = selectedPrinters[woId]?.[type];
    
    if (!selectedPrinter) {
      setSnackbar({ open: true, message: `Please select a printer for ${type} labels`, severity: 'error' });
      return;
    }

    const endpointMap = {
      tray: 'print_selected_tray_labels',
      pallet: 'print_selected_pallet_labels',
      cabinet: 'print_selected_cabinet_labels'
    };
    
    const printKey = `${woId}_${type}`;
    setPrintingStatus(prev => ({ ...prev, [printKey]: true }));

    try {
      let body = {
        printer_name: selectedPrinter,
        is_supervisor: isUnlocked
      };
      
      if (type === 'tray') {
        body.tray_ids = selectedLabels.map(label => label.wo_tray_id);
      } else if (type === 'pallet') {
        body.pallet_ids = selectedLabels.map(label => label.wo_pallet_id);
        body.wo_id = woId;
      } else if (type === 'cabinet') {
        body.cabinet_labels = selectedLabels.map(label => label.wo_cabinetlabel);
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/${endpointMap[type]}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.status === 200) {
        setSnackbar({ open: true, message: `Sent ${data.printed} label(s) to printer successfully!`, severity: 'success' });
        setSelectionDialog({ open: false, type: '', woId: null, workOrder: null });
        setSelectedLabels([]);
        setAvailableLabels([]);
      } else {
        setSnackbar({ open: true, message: data.message || 'Failed to print labels', severity: 'error' });
      }
    } catch (error) {
      console.error('Print error:', error);
      setSnackbar({ open: true, message: 'Error sending to printer', severity: 'error' });
    } finally {
      setPrintingStatus(prev => ({ ...prev, [printKey]: false }));
    }
  };

  const getLabelId = (label) => {
    if (selectionDialog.type === 'tray') return label.wo_tray_id;
    if (selectionDialog.type === 'pallet') return label.wo_pallet_id;
    if (selectionDialog.type === 'cabinet') return label.wo_cabinetlabel;
    return null;
  };

  const getLabelName = (label) => {
    if (selectionDialog.type === 'tray') return label.wo_traylabel;
    if (selectionDialog.type === 'pallet') return label.wo_palletlabel;
    if (selectionDialog.type === 'cabinet') return label.wo_cabinetlabel;
    return '';
  };

  const getPrintDate = (label) => {
    if (selectionDialog.type === 'tray') return label.wo_traylabel_printdate;
    if (selectionDialog.type === 'pallet') return label.wo_palletlabel_printdate;
    if (selectionDialog.type === 'cabinet') return label.wo_cabinetlabel_printdate;
    return null;
  };

  const toggleLabelSelection = (label, index, shiftKey) => {
    const labelId = getLabelId(label);
    
    // Shift-click for range selection
    if (shiftKey && lastSelectedIndex !== null) {
      const paginatedLabels = getPaginatedLabels();
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeLabels = paginatedLabels.slice(start, end + 1);
      
      // Merge with existing selected labels, avoiding duplicates
      setSelectedLabels(prev => {
        const existingIds = prev.map(l => getLabelId(l));
        const newLabels = rangeLabels.filter(l => !existingIds.includes(getLabelId(l)));
        return [...prev, ...newLabels];
      });
    } else {
      // Toggle single label
      setSelectedLabels(prev => {
        const isSelected = prev.some(l => getLabelId(l) === labelId);
        if (isSelected) {
          return prev.filter(l => getLabelId(l) !== labelId);
        } else {
          return [...prev, label];
        }
      });
    }
    setLastSelectedIndex(index);
  };

  const selectAllFiltered = () => {
    const filtered = getSortedAndFilteredLabels();
    setSelectedLabels(filtered);
  };

  const selectFirst = (count) => {
    const filtered = getSortedAndFilteredLabels();
    const firstN = filtered.slice(0, count);
    setSelectedLabels(firstN);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    if (!selectionDialog.open) return;

    const handleKeyDown = (e) => {
      // Ctrl/Cmd + A to select all filtered
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        selectAllFiltered();
      }
      // Escape to close
      if (e.key === 'Escape') {
        setSelectionDialog({ open: false, type: '', woId: null, workOrder: null });
        setSelectedLabels([]);
        setAvailableLabels([]);
        setSearchText('');
      }
      // Enter to print
      if (e.key === 'Enter' && selectedLabels.length > 0 && !e.target.matches('input')) {
        handlePrintSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionDialog.open, selectedLabels]);

  const deselectAll = () => {
    setSelectedLabels([]);
  };

  const getSortedAndFilteredLabels = () => {
    let filtered = availableLabels;
    
    // Filter by print status
    if (filterPrinted === 'printed') {
      filtered = filtered.filter(label => {
        const printDate = getPrintDate(label);
        return printDate && printDate !== '';
      });
    } else if (filterPrinted === 'unprinted') {
      filtered = filtered.filter(label => {
        const printDate = getPrintDate(label);
        return !printDate || printDate === '';
      });
    }
    
    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(label => 
        getLabelName(label).toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return getLabelName(a).localeCompare(getLabelName(b));
      } else if (sortBy === 'date') {
        const dateA = getPrintDate(a) ? parseInt(getPrintDate(a)) : 0;
        const dateB = getPrintDate(b) ? parseInt(getPrintDate(b)) : 0;
        return dateB - dateA; // Most recent first
      } else if (sortBy === 'status') {
        const statusA = getPrintDate(a) ? 1 : 0;
        const statusB = getPrintDate(b) ? 1 : 0;
        return statusA - statusB; // Unprinted first
      }
      return 0;
    });
    
    return filtered;
  };

  const getPaginatedLabels = () => {
    const sorted = getSortedAndFilteredLabels();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sorted.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(getSortedAndFilteredLabels().length / itemsPerPage);
  };

  // Printer selection is DB-controlled. Supervisors can temporarily override for this session only.
  const handlePrinterChange = (woId, type, printerName) => {
    if (!isUnlocked) {
      setSnackbar({ open: true, message: 'Supervisor access required to change printer', severity: 'warning' });
      return;
    }
    
    // Update local state only - no DB persistence
    const newSelections = {
      ...selectedPrinters,
      [woId]: { ...selectedPrinters[woId], [type]: printerName }
    };
    setSelectedPrinters(newSelections);
  };

  // Function to fetch incomplete work orders
  const fetchWorkOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = `${process.env.REACT_APP_BACKEND_HOST}/api/scan/getic`;
      
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();
      
      if (data.success === 1) {
        setWorkOrder(data.data || []);
      } else {
        setWorkOrder([]);
        setSnackbar({ open: true, message: 'Failed to fetch work orders', severity: 'error' });
      }
    } catch (error) {
      console.error('Error fetching work orders:', error);
      setSnackbar({ open: true, message: 'Error fetching work orders', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Function to search work orders (includes closed)
  const searchWorkOrders = React.useCallback(async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const url = `${process.env.REACT_APP_BACKEND_HOST}/api/scan/workorders/search?search=${encodeURIComponent(searchTerm)}`;
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();
      
      if (data.success === 1) {
        setSearchResults(data.data || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching work orders:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (workOrderSearch && isUnlocked) {
        searchWorkOrders(workOrderSearch);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [workOrderSearch, isUnlocked, searchWorkOrders]);

  // Fetch incomplete work orders on component mount
  React.useEffect(() => {
    fetchWorkOrders();
  }, [fetchWorkOrders]);

  console.log(workOrder)
  const [responseData, setResponseData] = React.useState(null);
  console.log(responseData);

  console.log(JSON.stringify(workOrder));
  
  // When supervisor is unlocked, use scrollable layout; otherwise use centered layout
  const useScrollableLayout = isUnlocked;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: useScrollableLayout ? '100vh' : 'auto', 
      overflow: useScrollableLayout ? 'hidden' : 'visible' 
    }}>
      <AppBar position={useScrollableLayout ? "sticky" : "static"} id="appbar" sx={{ flexShrink: 0 }}>
        <Toolbar>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={1}>
              <Typography variant="subtitle1">
                IKB | 2.0
              </Typography>
              <Typography variant="subtitle2" >
                BETA
              </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Typography variant="body2" align='right'>
                  Print Station
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={3} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <IconButton 
                onClick={handleUnlockClick}
                sx={{ color: 'white' }}
                title={isUnlocked ? "Lock printer settings" : "Unlock printer settings"}
              >
                {isUnlocked ? <LockOpenIcon /> : <HandymanIcon />}
              </IconButton>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>

      {/* Password Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)}>
        <DialogTitle>Supervisor Access Required</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handlePasswordSubmit();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialog(false); setPasswordInput(''); }}>
            Cancel
          </Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Unlock
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manager Mode: Search for work orders including closed */}
      <Collapse in={isUnlocked} timeout={500} sx={{ flexShrink: 0 }}>
        <Box sx={{ 
          p: 2, 
          backgroundColor: '#f5f5f5', 
          borderBottom: '1px solid #ddd',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <TextField
            label="Search Work Orders (Including Closed)"
            placeholder="Enter work order number..."
            value={workOrderSearch}
            onChange={(e) => setWorkOrderSearch(e.target.value)}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              endAdornment: isSearching ? <CircularProgress size={20} /> : null
            }}
          />
          
          {workOrderSearch.length > 0 && workOrderSearch.length < 2 && (
            <Typography variant="caption" color="text.secondary">
              Enter at least 2 characters to search
            </Typography>
          )}

          {searchResults.length > 0 && (
            <Chip 
              label={`Found ${searchResults.length} work order(s)`}
              color="info"
              size="small"
              sx={{ ml: 1 }}
            />
          )}
        </Box>
      </Collapse>

      {/* Scrollable container when supervisor mode is active */}
      {useScrollableLayout ? (
        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'auto', p: 2, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', transform: 'none', top: 'auto', left: 'auto', width: '100%', maxWidth: '800px' }}>
            {/* Search Results Section */}
            {workOrderSearch.length >= 2 && (
              <>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1976d2' }}>
                  Search Results
                </Typography>
                {isSearching ? (
                  <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                    <CircularProgress />
                  </Box>
                ) : searchResults.length === 0 ? (
                  <Box p={2} sx={{ mb: 3 }}>
                    <Typography variant="body1" align="center" color="text.secondary">
                      No work orders found matching "{workOrderSearch}"
                    </Typography>
                  </Box>
                ) : (
                  searchResults.map((e, index) => {
                    const trayPrintKey = `${e.wo_id}_tray`;
                    const cabinetPrintKey = `${e.wo_id}_cabinet`;
                    const palletPrintKey = `${e.wo_id}_pallet`;
                    const isCompleted = e.complete_date && e.complete_date !== '';
                    // Check if this work order is already in the incomplete list
                    const isInIncompleteList = workOrder.some(wo => wo.wo_id === e.wo_id);
                    if (isInIncompleteList) return null; // Skip if already shown below

                    return (
                      <div key={`search-${index}`} style={{ marginBottom: expandedAccordion === e.wo_id ? '16px' : '0' }}>
                        <Accordion 
                          disableGutters="true"
                          expanded={expandedAccordion === e.wo_id}
                          onChange={handleAccordionChange(e.wo_id)}
                          sx={{
                            marginBottom: 2,
                            borderRadius: '8px !important',
                            border: isCompleted ? '2px solid #9e9e9e' : '2px solid #808080',
                            overflow: 'hidden',
                            '&:before': { display: 'none' },
                            boxShadow: 'none',
                            opacity: isCompleted ? 0.85 : 1,
                          }}
                        >
                          <AccordionSummary
                            aria-controls="panel1-content"
                            id={`search-panel-${e.wo_id}`}
                            sx={{
                              backgroundColor: isCompleted ? '#b0bec5' : '#87CEEB',
                              color: '#000000',
                              minHeight: '60px',
                              '&:hover': { backgroundColor: isCompleted ? '#90a4ae' : '#7BC4E6' },
                              '& .MuiAccordionSummary-content': { margin: '16px 0', justifyContent: 'center' },
                              '&.Mui-expanded': { minHeight: '60px' }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', width: '100%' }}>
                              <Typography variant="h6" sx={{ fontWeight: 500, color: '#000000', textAlign: 'center' }}>
                                Work Order: {e.work_order}
                              </Typography>
                              {isCompleted && (
                                <Chip label="CLOSED" size="small" sx={{ backgroundColor: '#757575', color: 'white', fontWeight: 600, fontSize: '0.7rem' }} />
                              )}
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                                  <Button variant="contained" onClick={() => handleLabelClick(e)} disabled={printingStatus[trayPrintKey] || !selectedPrinters[e.wo_id]?.tray} sx={{ minWidth: 200 }}>
                                    {printingStatus[trayPrintKey] ? <CircularProgress size={24} color="inherit" /> : 'PRINT TRAY LABELS'}
                                  </Button>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Select Tray Printer</InputLabel>
                                    <Select value={selectedPrinters[e.wo_id]?.tray || ''} label="Select Tray Printer" onChange={(ev) => handlePrinterChange(e.wo_id, 'tray', ev.target.value)}>
                                      {printers.map((printer) => (<MenuItem key={printer.cfg_id} value={printer.cfg_name}>{printer.cfg_name}</MenuItem>))}
                                    </Select>
                                  </FormControl>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                                  <Button variant="contained" onClick={() => handleCabinetClick(e)} disabled={printingStatus[cabinetPrintKey] || !selectedPrinters[e.wo_id]?.cabinet} sx={{ minWidth: 200 }}>
                                    {printingStatus[cabinetPrintKey] ? <CircularProgress size={24} color="inherit" /> : 'PRINT CABINET LABELS'}
                                  </Button>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Select Cabinet Label Printer</InputLabel>
                                    <Select value={selectedPrinters[e.wo_id]?.cabinet || ''} label="Select Cabinet Label Printer" onChange={(ev) => handlePrinterChange(e.wo_id, 'cabinet', ev.target.value)}>
                                      {printers.map((printer) => (<MenuItem key={printer.cfg_id} value={printer.cfg_name}>{printer.cfg_name}</MenuItem>))}
                                    </Select>
                                  </FormControl>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                                  <Button variant="contained" onClick={() => handlePalletClick(e)} disabled={printingStatus[palletPrintKey] || !selectedPrinters[e.wo_id]?.pallet} sx={{ minWidth: 200 }}>
                                    {printingStatus[palletPrintKey] ? <CircularProgress size={24} color="inherit" /> : 'PRINT PALLET LABELS'}
                                  </Button>
                                  <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Select Pallet Printer</InputLabel>
                                    <Select value={selectedPrinters[e.wo_id]?.pallet || ''} label="Select Pallet Printer" onChange={(ev) => handlePrinterChange(e.wo_id, 'pallet', ev.target.value)}>
                                      {printers.map((printer) => (<MenuItem key={printer.cfg_id} value={printer.cfg_name}>{printer.cfg_name}</MenuItem>))}
                                    </Select>
                                  </FormControl>
                                </Box>
                              </Box>
                              {/* Select specific labels buttons for search results */}
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mt: 1 }}>
                                <Button 
                                  variant="outlined" 
                                  onClick={() => handleOpenSelection('tray', e)}
                                  disabled={!selectedPrinters[e.wo_id]?.tray}
                                  sx={{ minWidth: 200, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                  SELECT TRAY LABELS
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  onClick={() => handleOpenSelection('cabinet', e)}
                                  disabled={!selectedPrinters[e.wo_id]?.cabinet}
                                  sx={{ minWidth: 200, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                  SELECT CABINET LABELS
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  onClick={() => handleOpenSelection('pallet', e)}
                                  disabled={!selectedPrinters[e.wo_id]?.pallet}
                                  sx={{ minWidth: 200, borderWidth: 2, '&:hover': { borderWidth: 2 } }}
                                >
                                  SELECT PALLET LABELS
                                </Button>
                              </Box>
                            </Box>
                          </AccordionDetails>
                        </Accordion>
                      </div>
                    );
                  })
                )}
                <Box sx={{ borderBottom: '1px solid #ddd', my: 3 }} />
              </>
            )}
            
            {/* Incomplete Work Orders Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Incomplete Work Orders
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
              </Box>
            ) : workOrder.length === 0 ? (
              <Box p={4}>
                <Typography variant="h6" align="center">
                  No incomplete work orders found
                </Typography>
              </Box>
            ) : (
              workOrder.map((e, index) => {
                const trayPrintKey = `${e.wo_id}_tray`;
                const cabinetPrintKey = `${e.wo_id}_cabinet`;
                const palletPrintKey = `${e.wo_id}_pallet`;
                const isCompleted = e.complete_date && e.complete_date !== '';

            return (
              <div key={index} style={{ marginBottom: expandedAccordion === e.wo_id ? '16px' : '0' }}>
                <Accordion 
                  disableGutters="true"
                  expanded={expandedAccordion === e.wo_id}
                  onChange={handleAccordionChange(e.wo_id)}
                  sx={{
                    marginBottom: 2,
                    borderRadius: '8px !important',
                    border: isCompleted ? '2px solid #9e9e9e' : '2px solid #808080',
                    overflow: 'hidden',
                    '&:before': {
                      display: 'none',
                    },
                    boxShadow: 'none',
                    opacity: isCompleted ? 0.85 : 1,
                  }}
                >
                  <AccordionSummary
                    aria-controls="panel1-content"
                    id="panel1-header"
                    sx={{
                      backgroundColor: isCompleted ? '#b0bec5' : '#87CEEB',
                      color: '#000000',
                      minHeight: '60px',
                      '&:hover': {
                        backgroundColor: isCompleted ? '#90a4ae' : '#7BC4E6',
                      },
                      '& .MuiAccordionSummary-content': {
                        margin: '16px 0',
                        justifyContent: 'center',
                      },
                      '&.Mui-expanded': {
                        minHeight: '60px',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', width: '100%' }}>
                      <Typography variant="h6" sx={{ fontWeight: 500, color: '#000000', textAlign: 'center' }}>
                        Work Order: {e.work_order}
                      </Typography>
                      {isCompleted && (
                        <Chip 
                          label="CLOSED" 
                          size="small" 
                          sx={{ 
                            backgroundColor: '#757575', 
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem'
                          }} 
                        />
                      )}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                      {/* Top Row: Main Print Buttons */}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                          <Button 
                            variant="contained" 
                            onClick={() => handleLabelClick(e)}
                            disabled={printingStatus[trayPrintKey] || !selectedPrinters[e.wo_id]?.tray}
                            startIcon={printingStatus[trayPrintKey] ? <CircularProgress size={20} /> : null}
                            sx={{ minWidth: 220 }}
                          >
                            {printingStatus[trayPrintKey] ? 'Printing...' : 'PRINT ALL TRAY LABELS'}
                          </Button>
                          <Collapse in={isUnlocked} timeout={800}>
                            <FormControl sx={{ minWidth: 220 }} size="small">
                              <InputLabel>Tray Label Printer</InputLabel>
                              <Select
                                value={selectedPrinters[e.wo_id]?.tray || ''}
                                label="Tray Label Printer"
                                onChange={(event) => {
                                  handlePrinterChange(e.wo_id, 'tray', event.target.value);
                                }}
                              >
                                {printers.map((printer) => (
                                  <MenuItem key={printer.cfg_id} value={printer.cfg_name}>
                                    {printer.cfg_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Collapse>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                          <Button 
                            variant="contained" 
                            onClick={() => handleCabinetClick(e)}
                            disabled={printingStatus[cabinetPrintKey] || !selectedPrinters[e.wo_id]?.cabinet}
                            startIcon={printingStatus[cabinetPrintKey] ? <CircularProgress size={20} /> : null}
                            sx={{ minWidth: 220 }}
                          >
                            {printingStatus[cabinetPrintKey] ? 'Printing...' : 'PRINT ALL CABINET LABELS'}
                          </Button>
                          <Collapse in={isUnlocked} timeout={800}>
                            <FormControl sx={{ minWidth: 220 }} size="small">
                              <InputLabel>Cabinet Label Printer</InputLabel>
                              <Select
                                value={selectedPrinters[e.wo_id]?.cabinet || ''}
                                label="Cabinet Label Printer"
                                onChange={(event) => {
                                  handlePrinterChange(e.wo_id, 'cabinet', event.target.value);
                                }}
                              >
                                {printers.map((printer) => (
                                  <MenuItem key={printer.cfg_id} value={printer.cfg_name}>
                                    {printer.cfg_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Collapse>
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                          <Button 
                            variant="contained" 
                            onClick={() => handlePalletClick(e)}
                            disabled={printingStatus[palletPrintKey] || !selectedPrinters[e.wo_id]?.pallet}
                            startIcon={printingStatus[palletPrintKey] ? <CircularProgress size={20} /> : null}
                            sx={{ minWidth: 220 }}
                          >
                            {printingStatus[palletPrintKey] ? 'Printing...' : 'PRINT ALL PALLET LABELS'}
                          </Button>
                          <Collapse in={isUnlocked} timeout={800}>
                            <FormControl sx={{ minWidth: 220 }} size="small">
                              <InputLabel>Pallet Label Printer</InputLabel>
                              <Select
                                value={selectedPrinters[e.wo_id]?.pallet || ''}
                                label="Pallet Label Printer"
                                onChange={(event) => {
                                  handlePrinterChange(e.wo_id, 'pallet', event.target.value);
                                }}
                              >
                                {printers.map((printer) => (
                                  <MenuItem key={printer.cfg_id} value={printer.cfg_name}>
                                    {printer.cfg_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Collapse>
                        </Box>
                      </Box>

                      {/* Middle Row: Select Specific Labels Buttons - Glides out when unlocked */}
                      <Collapse in={isUnlocked} timeout={600}>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 2, 
                          flexWrap: 'wrap', 
                          alignItems: 'center',
                          transition: 'all 0.3s ease-in-out'
                        }}>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleOpenSelection('tray', e)}
                            disabled={!selectedPrinters[e.wo_id]?.tray}
                            sx={{ 
                              minWidth: 220,
                              borderWidth: 2,
                              '&:hover': { borderWidth: 2 }
                            }}
                          >
                            SELECT TRAY LABELS
                          </Button>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleOpenSelection('cabinet', e)}
                            disabled={!selectedPrinters[e.wo_id]?.cabinet}
                            sx={{ 
                              minWidth: 220,
                              borderWidth: 2,
                              '&:hover': { borderWidth: 2 }
                            }}
                          >
                            SELECT CABINET LABELS
                          </Button>
                          <Button 
                            variant="outlined" 
                            onClick={() => handleOpenSelection('pallet', e)}
                            disabled={!selectedPrinters[e.wo_id]?.pallet}
                            sx={{ 
                              minWidth: 220,
                              borderWidth: 2,
                              '&:hover': { borderWidth: 2 }
                            }}
                          >
                            SELECT PALLET LABELS
                          </Button>
                        </Box>
                      </Collapse>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </div>
            )
          })
        )}
          </div>
        </Box>
      ) : (
        /* Default centered layout when supervisor is not logged in */
        <div className='Active_orders'>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
            </Box>
          ) : workOrder.length === 0 ? (
            <Box p={4}>
              <Typography variant="h6" align="center">No incomplete work orders found</Typography>
            </Box>
          ) : (
            workOrder.map((e, index) => {
              const trayPrintKey = `${e.wo_id}_tray`;
              const cabinetPrintKey = `${e.wo_id}_cabinet`;
              const palletPrintKey = `${e.wo_id}_pallet`;
              const isCompleted = e.complete_date && e.complete_date !== '';

              return (
                <div key={index} style={{ marginBottom: expandedAccordion === e.wo_id ? '16px' : '0' }}>
                  <Accordion 
                    disableGutters="true"
                    expanded={expandedAccordion === e.wo_id}
                    onChange={handleAccordionChange(e.wo_id)}
                    sx={{
                      marginBottom: 2,
                      borderRadius: '8px !important',
                      border: isCompleted ? '2px solid #9e9e9e' : '2px solid #808080',
                      overflow: 'hidden',
                      '&:before': {
                        display: 'none',
                      },
                      boxShadow: 'none',
                      opacity: isCompleted ? 0.85 : 1,
                    }}
                  >
                    <AccordionSummary
                      aria-controls="panel1-content"
                      id="panel1-header"
                      sx={{
                        backgroundColor: isCompleted ? '#b0bec5' : '#87CEEB',
                        color: '#000000',
                        minHeight: '60px',
                        '&:hover': {
                          backgroundColor: isCompleted ? '#90a4ae' : '#7BC4E6',
                        },
                        '& .MuiAccordionSummary-content': {
                          margin: '16px 0',
                          justifyContent: 'center',
                        },
                        '&.Mui-expanded': {
                          minHeight: '60px',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'center', width: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 500, color: '#000000', textAlign: 'center' }}>
                          Work Order: {e.work_order}
                        </Typography>
                        {isCompleted && (
                          <Chip 
                            label="CLOSED" 
                            size="small" 
                            sx={{ 
                              backgroundColor: '#757575', 
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.7rem'
                            }} 
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                            <Button 
                              variant="contained" 
                              onClick={() => handleLabelClick(e)}
                              disabled={printingStatus[trayPrintKey] || !selectedPrinters[e.wo_id]?.tray}
                              startIcon={printingStatus[trayPrintKey] ? <CircularProgress size={20} /> : null}
                              sx={{ minWidth: 220 }}
                            >
                              {printingStatus[trayPrintKey] ? 'Printing...' : 'PRINT ALL TRAY LABELS'}
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                            <Button 
                              variant="contained" 
                              onClick={() => handleCabinetClick(e)}
                              disabled={printingStatus[cabinetPrintKey] || !selectedPrinters[e.wo_id]?.cabinet}
                              startIcon={printingStatus[cabinetPrintKey] ? <CircularProgress size={20} /> : null}
                              sx={{ minWidth: 220 }}
                            >
                              {printingStatus[cabinetPrintKey] ? 'Printing...' : 'PRINT ALL CABINET LABELS'}
                            </Button>
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: '0 0 auto' }}>
                            <Button 
                              variant="contained" 
                              onClick={() => handlePalletClick(e)}
                              disabled={printingStatus[palletPrintKey] || !selectedPrinters[e.wo_id]?.pallet}
                              startIcon={printingStatus[palletPrintKey] ? <CircularProgress size={20} /> : null}
                              sx={{ minWidth: 220 }}
                            >
                              {printingStatus[palletPrintKey] ? 'Printing...' : 'PRINT ALL PALLET LABELS'}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </AccordionDetails>
                  </Accordion>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Label Selection Dialog */}
      <Dialog 
        open={selectionDialog.open} 
        onClose={() => {
          setSelectionDialog({ open: false, type: '', woId: null, workOrder: null });
          setSelectedLabels([]);
          setAvailableLabels([]);
          setSearchText('');
        }}
        maxWidth="lg"
        fullWidth
        TransitionProps={{
          onEntered: () => {
            // Auto-focus search bar when dialog opens
            const searchInput = document.querySelector('input[placeholder="Search labels..."]');
            if (searchInput) searchInput.focus();
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="h6">
                Select {selectionDialog.type === 'tray' ? 'Tray' : selectionDialog.type === 'pallet' ? 'Pallet' : 'Cabinet'} Labels
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectionDialog.workOrder?.work_order}
              </Typography>
            </Box>
            <Chip 
              label={`${selectedLabels.length} selected`} 
              color={selectedLabels.length > 0 ? "primary" : "default"}
              size="medium"
            />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {loadingLabels ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Search and Filter Controls */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
                <TextField
                  size="small"
                  placeholder="Search labels..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  sx={{ flex: '1 1 200px', minWidth: 200 }}
                  InputProps={{
                    startAdornment: <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>🔍</Typography>
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150, flex: '0 0 auto' }}>
                  <Select
                    value={filterPrinted}
                    onChange={(e) => {
                      setFilterPrinted(e.target.value);
                      setCurrentPage(1);
                    }}
                    displayEmpty
                  >
                    <MenuItem value="all">Print Status: All</MenuItem>
                    <MenuItem value="unprinted">Print Status: Not Printed</MenuItem>
                    <MenuItem value="printed">Print Status: Printed</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 130, flex: '0 0 auto' }}>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="name">Sort By: Name</MenuItem>
                    <MenuItem value="status">Sort By: Status</MenuItem>
                    <MenuItem value="date">Sort By: Date Printed</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Dual Pane Layout */}
              <Box sx={{ display: 'flex', gap: 2, height: 500 }}>
                {/* Left Pane: Available Labels Browser */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Box sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1,
                    flexShrink: 0
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Available ({getSortedAndFilteredLabels().length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Button size="small" variant="outlined" onClick={selectAllFiltered} title="Ctrl+A">
                        Select All
                      </Button>
                      <FormControl size="small" sx={{ minWidth: 90 }}>
                        <InputLabel>Per Page</InputLabel>
                        <Select
                          value={itemsPerPage}
                          label="Per Page"
                          onChange={(e) => {
                            setItemsPerPage(e.target.value);
                            setCurrentPage(1);
                          }}
                        >
                          <MenuItem value={10}>10</MenuItem>
                          <MenuItem value={25}>25</MenuItem>
                          <MenuItem value={50}>50</MenuItem>
                          <MenuItem value={100}>100</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: 'white',
                    minHeight: 0
                  }}>
                    {getPaginatedLabels().length > 0 ? (
                      getPaginatedLabels().map((label, index) => {
                        const labelId = getLabelId(label);
                        const labelName = getLabelName(label);
                        const printDate = getPrintDate(label);
                        const isPrinted = printDate && printDate !== '';
                        const isSelected = selectedLabels.some(l => getLabelId(l) === labelId);
                        
                        return (
                          <Box 
                            key={labelId}
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              p: 1.5,
                              gap: 1.5,
                              borderBottom: '1px solid #f0f0f0',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              '&:hover': { 
                                bgcolor: isSelected ? '#bbdefb' : '#f5f5f5',
                                transform: 'translateX(4px)'
                              },
                              bgcolor: isSelected ? '#e3f2fd' : 'transparent',
                              borderLeft: isSelected ? '3px solid #1976d2' : '3px solid transparent'
                            }}
                            onClick={(e) => toggleLabelSelection(label, index, e.shiftKey)}
                          >
                            <Box 
                              sx={{ 
                                width: 10, 
                                height: 10, 
                                borderRadius: '50%', 
                                bgcolor: isPrinted ? '#9e9e9e' : '#4caf50',
                                flexShrink: 0
                              }} 
                            />
                            
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={isSelected ? 600 : 400}
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {labelName}
                              </Typography>
                              {isPrinted && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(parseInt(printDate)).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                            
                            {isSelected && (
                              <Chip 
                                label="✓" 
                                color="primary" 
                                size="small"
                                sx={{ minWidth: 32, height: 24 }}
                              />
                            )}
                          </Box>
                        );
                      })
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="body1" color="text.secondary" gutterBottom>
                          {searchText ? '🔍 No matching labels' : '📋 No labels found'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {searchText ? 'Try adjusting your search or filter' : 'Try changing the filter'}
                        </Typography>
                        {searchText && (
                          <Button size="small" onClick={() => setSearchText('')} sx={{ mt: 2 }}>
                            Clear Search
                          </Button>
                        )}
                      </Box>
                    )}
                  </Box>
                  
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <Box sx={{ 
                      mt: 1, 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 2,
                      flexShrink: 0
                    }}>
                      <Button 
                        size="small"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Previous
                      </Button>
                      <Typography variant="body2" color="text.secondary">
                        Page {currentPage} of {getTotalPages()}
                      </Typography>
                      <Button 
                        size="small"
                        disabled={currentPage === getTotalPages()}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Next
                      </Button>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block', flexShrink: 0 }}>
                    Shift+Click for range • Ctrl+A to select all
                  </Typography>
                </Box>

                {/* Right Pane: Selected Items */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  <Box sx={{ 
                    mb: 1, 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 1,
                    flexShrink: 0
                  }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Selected ({selectedLabels.length})
                    </Typography>
                    {selectedLabels.length > 0 && (
                      <Button 
                        size="small" 
                        onClick={() => setSelectedLabels([])}
                        color="error"
                        variant="outlined"
                      >
                        Clear All
                      </Button>
                    )}
                  </Box>
                  
                  <Box sx={{ 
                    flex: 1,
                    overflow: 'auto',
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    bgcolor: '#fafafa',
                    minHeight: 0
                  }}>
                    {selectedLabels.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        flexDirection: 'column',
                        height: '100%',
                        color: 'text.secondary',
                        gap: 1
                      }}>
                        <Typography variant="h6" sx={{ fontStyle: 'italic', opacity: 0.5 }}>
                          No labels selected
                        </Typography>
                        <Typography variant="caption">
                          Click labels on the left to add them
                        </Typography>
                      </Box>
                    ) : (
                      selectedLabels.map((label) => {
                        const labelId = getLabelId(label);
                        const labelName = getLabelName(label);
                        const printDate = getPrintDate(label);
                        
                        return (
                          <Box
                            key={labelId}
                            sx={{
                              p: 1.5,
                              borderBottom: '1px solid #e0e0e0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              bgcolor: 'white',
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: '#f5f5f5'
                              }
                            }}
                          >
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography 
                                variant="body2" 
                                fontWeight={500}
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {labelName}
                              </Typography>
                              {printDate && (
                                <Typography variant="caption" color="text.secondary">
                                  Last printed: {new Date(parseInt(printDate)).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => setSelectedLabels(selectedLabels.filter(l => getLabelId(l) !== labelId))}
                              color="error"
                              sx={{ ml: 1 }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })
                    )}
                  </Box>
                </Box>
              </Box>
              
              {/* Summary Footer */}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Showing <strong>{getPaginatedLabels().length}</strong> of <strong>{getSortedAndFilteredLabels().length}</strong> filtered labels ({availableLabels.length} total)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Tip: Shift+Click to select range • Enter to print
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => { 
              setSelectionDialog({ open: false, type: '', woId: null, workOrder: null }); 
              setSelectedLabels([]);
              setAvailableLabels([]);
              setSearchText('');
            }}
          >
            Cancel (Esc)
          </Button>
          <Button 
            onClick={handlePrintSelected} 
            variant="contained"
            disabled={selectedLabels.length === 0}
            size="large"
          >
            Print {selectedLabels.length > 0 && `${selectedLabels.length} Label${selectedLabels.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}
export default PrintStation
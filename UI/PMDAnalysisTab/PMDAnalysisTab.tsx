import "./PMDAnalysisTab.scss";

import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
  ObservableArray,
  ObservableValue
} from "azure-devops-ui/Core/Observable";
import {
  renderSimpleCell,
  Table,
  TableColumnLayout,
  ColumnFill,
} from "azure-devops-ui/Table";
import { showRootComponent } from "../Common";
import { getClient } from "azure-devops-extension-api";
import {
  BuildRestClient,
  IBuildPageDataService,
  BuildServiceIds,
} from "azure-devops-extension-api/Build";
import CodeAnalysisRetriever from "./CodeAnalysis/CodeAnalysisRetriever";
import CodeAnalysisArtifactProcessor, {
  CodeAnalysisResult,
  CodeAnalyisDetail
} from "./CodeAnalysis/CodeAnalysisArtifactProcessor";

import MetricsComponent from "../MetricsComponent/MetricsComponent";

interface IBuildInfoTabState {
  isDataLoaded: boolean;
  criticaldefects: number;
  violationCount: number;
  affectedFileCount: number;
  details: CodeAnalyisDetail[];
}

class PMDAnalysisTab extends React.Component<{}, IBuildInfoTabState> {
  private itemProvider = new ObservableArray<
    CodeAnalyisDetail | ObservableValue<CodeAnalyisDetail | undefined>
  >();
  private asyncColumns = [
    {
      columnLayout: TableColumnLayout.none,
      id: "filename",
      name: "File Name",
      readonly: true,
      renderCell: renderSimpleCell,
      width: 500
    },
    {
      columnLayout: TableColumnLayout.none,
      id: "beginLine",
      name: "Line Number",
      readonly: true,
      renderCell: renderSimpleCell,
      width: 100
    },
    {
      id: "priority",
      name: "Priority",
      readonly: true,
      renderCell: renderSimpleCell,
      width: 100,
      sortProps: {
        ariaLabelAscending: "Sorted low to high",
        ariaLabelDescending: "Sorted high to low"
      }
    },
    {
      columnLayout: TableColumnLayout.none,
      id: "problem",
      name: "Problem",
      readonly: true,
      renderCell: renderSimpleCell,
      width: 800
    },

    ColumnFill
  ];

  accessToken = "0";
  results: CodeAnalysisResult[] | undefined = [];
  result: CodeAnalysisResult | undefined = undefined;

  constructor(props: {}) {
    super(props);

    this.state = {
      isDataLoaded: false,
      criticaldefects: 0,
      violationCount: 0,
      affectedFileCount: 0,
      details: []
    };
  }

  public async componentDidMount() {
    this.initializeState();
  }

  private async initializeState(): Promise<void> {
    SDK.init();
    await SDK.ready();

    this.setState({ isDataLoaded: false });

    const buildInfo = await SDK.getService<IBuildPageDataService>(
      BuildServiceIds.BuildPageDataService
    );
    const buildPageData = await buildInfo.getBuildPageData();
    const client = getClient(BuildRestClient);

    this.setState({ isDataLoaded: true });

    let codeAnalysisRetriever: CodeAnalysisRetriever = new CodeAnalysisRetriever(
      client,
      buildPageData!.definition!.project.id,
      buildPageData!.build!.id
    );

    var codeAnalysisReport: string[] = await codeAnalysisRetriever.downloadCodeAnalysisArtifact();

    let codeAnalysisProcessor: CodeAnalysisArtifactProcessor = new CodeAnalysisArtifactProcessor(
      codeAnalysisReport[0]
    );
    this.result = await codeAnalysisProcessor.processCodeQualityFromArtifact();
    this.setState({
      isDataLoaded: false,
      criticaldefects: this.result.criticaldefects,
      violationCount: this.result.violationCount,
      affectedFileCount: this.result.affectedFileCount,
      details: this.result.details
    });

    for (let i = 0; i < this.state.details.length; i++) {
      if (this.state.details[i].priority <= 3) {
        let asyncRow = new ObservableValue<CodeAnalyisDetail | undefined>(
          undefined
        );
        asyncRow.value = this.state.details[i];
        this.itemProvider.push(asyncRow);
      }
    }
  }

  public render(): JSX.Element {
    return (
      <div className="container">
        <div className="flex-row">
          <MetricsComponent
            title={"Validation Count"}
            value={this.state.violationCount}
          />
          <MetricsComponent
            title={"Critical Defects"}
            value={this.state.criticaldefects}
          />
          <MetricsComponent
            title={"Affected FileCount"}
            value={this.state.affectedFileCount}
          />
        </div>
        <p>Critical and Major Defects Summary - Full Report Available in Artifacts</p>
        <Table<{}>
          columns={this.asyncColumns}
          itemProvider={this.itemProvider}
          role="table"
        />
      </div>
    );
  }
}

showRootComponent(<PMDAnalysisTab />);

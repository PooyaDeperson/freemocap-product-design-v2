import asyncio
import logging
import multiprocessing
from abc import ABC
from dataclasses import dataclass
from enum import Enum, auto
from multiprocessing import Process, Queue
from threading import Thread
from typing import Hashable

import numpy as np
from numpydantic import NDArray, Shape
from pydantic import BaseModel
from skellycam.core.types.type_overloads import CameraIdString
from skellycam.core.camera.config.camera_config import CameraConfig, CameraConfigs
from skellycam.core.ipc.shared_memory.ring_buffer_shared_memory import SharedMemoryRingBufferDTO
from skellycam.core.ipc.shared_memory.frame_payload_shared_memory_ring_buffer import FramePayloadSharedMemoryRingBuffer
from skellycam.core.types.numpy_record_dtypes import FRAME_METADATA_DTYPE
logger = logging.getLogger(__name__)


class ReadTypes(str, Enum):
    LATEST = auto()
    NEXT = auto()

class BasePipelineData(BaseModel,ABC):
    pass


class BaseAggregationLayerOutputData(BasePipelineData):
    multi_frame_number: int
    points3d: dict[Hashable, NDArray[Shape["3"], np.float64]]



class BaseCameraNodeOutputData(BasePipelineData):
    frame_metadata: np.recarray#dtype: FRAME_METADATA_DTYPE
    time_to_retrieve_frame_ns: int
    time_to_process_frame_ns: int


class BasePipelineOutputData(BasePipelineData):
    camera_node_output: dict[CameraIdString, BaseCameraNodeOutputData]
    aggregation_layer_output: BaseAggregationLayerOutputData

    @property
    def multi_frame_number(self) -> int:
        frame_numbers = [camera_node_output.frame_metadata.frame_number for camera_node_output in self.camera_node_output.values()]
        if len(set(frame_numbers)) > 1:
            raise ValueError(f"Frame numbers from camera nodes do not match - got {frame_numbers}")
        return frame_numbers[0]


class BasePipelineStageConfig(BaseModel, ABC):
    pass


class BasePipelineConfig(BaseModel, ABC):
    camera_node_configs: dict[CameraIdString, BasePipelineStageConfig]
    aggregation_node_config: BasePipelineStageConfig

    @classmethod
    def create(cls, camera_ids: list[CameraIdString], tracker_config: BaseTrackerConfig):
        return cls(camera_node_configs={camera_id: BasePipelineStageConfig() for camera_id in camera_ids},
                   aggregation_node_config=BasePipelineStageConfig())


@dataclass
class PipelineIPC:
    should_continue: multiprocessing.Value
    pubsub: PubSubTopicManager
@dataclass
class CameraNode:
    camera_id: CameraIdString
    camera_ring_shm: SharedMemoryRingBufferDTO
    ipc: PipelineIPC
    worker: Process | Thread
    global_kill_flag: multiprocessing.Value

    @classmethod
    def create(cls,
                camera_id: CameraIdString,
                camera_shm_dto: SharedMemoryRingBufferDTO,
                output_queue: Queue,
                global_kill_flag: multiprocessing.Value):
        return cls(camera_id=camera_id,
                   worker=Process(target=cls._run,
                                  kwargs=dict(camera_id=camera_id,
                                               config=config,
                                               camera_shm_dto=camera_shm_dto,
                                               output_queue=output_queue,
                                               global_kill_flag=global_kill_flag
                                               )
                                  ),
                   global_kill_flag=global_kill_flag
                   )

    def intake_data(self, frame_payload: FramePayload):
        self.incoming_frame_shm.put_frame(frame_payload.image, frame_payload.metadata)

    @staticmethod
    def _run(camera_id: CameraId,
             config: BasePipelineStageConfig,
             incoming_frame_shm_dto: CameraSharedMemoryDTO,
             output_queue: Queue,
             all_ready_events: dict[CameraId, multiprocessing.Event],
             global_kill_flag: multiprocessing.Event):
        raise NotImplementedError(
            "Add your camera process logic here! See example in the `freemocap/.../dummy_pipeline.py` file.")
        # logger.trace(f"Starting camera processing node for camera {camera_ring_shm_dto.camera_id}")
        # camera_ring_shm = RingBufferCameraSharedMemory.recreate(dto=camera_ring_shm_dto,
        #                                                         read_only=False)
        # while not global_kill_flag.is_set():
        #     time.sleep(0.001)
        #     if camera_ring_shm.ready_to_read:
        #
        #         if read_type == ReadTypes.LATEST_AND_INCREMENT:
        #             image = camera_ring_shm.retrieve_latest_frame(increment=True)
        #         elif read_type == ReadTypes.LATEST_READ_ONLY:
        #             image = camera_ring_shm.retrieve_latest_frame(increment=False)
        #         elif read_type == ReadTypes.NEXT:
        #             image = camera_ring_shm.retrieve_next_frame()
        #         else:
        #             raise ValueError(f"Invalid read_type: {read_type}")
        #
        #         logger.trace(f"Processing image from camera {camera_ring_shm.camera_id}")
        #         # TODO - process image
        #         output_queue.put(PipelineData(data=image))

    def start(self):
        logger.debug(f"Starting {self.__class__.__name__} for camera {self.camera_id}")
        self.worker.start()

    def stop(self):
        logger.debug(f"Stopping {self.__class__.__name__} for camera {self.camera_id}")
        self.global_kill_flag.set()
        self.worker.join()


@dataclass
class BaseAggregationNode(ABC):
    config: BasePipelineStageConfig
    process: Process| Thread
    input_queues: dict[CameraId, Queue]
    output_queue: Queue
    global_kill_flag: multiprocessing.Event

    @classmethod
    def create(cls,
               config: BasePipelineStageConfig,
               input_queues: dict[CameraId, Queue],
               output_queue: Queue,
               all_ready_events: dict[CameraId|str, multiprocessing.Event],
               global_kill_flag: multiprocessing.Event):
        raise NotImplementedError(
            "You need to re-implement this method with your pipeline's version of the AggregationProcessNode "
            "abstract base class! See example in the `freemocap/.../dummy_pipeline.py` file.")
        # return cls(config=config,
        #            process=Process(target=cls._run,
        #                            kwargs=dict(config=config,
        #                                        input_queues=input_queues,
        #                                        output_queue=output_queue,
        #                                        global_kill_flag=global_kill_flag)
        #                            ),
        #            input_queues=input_queues,
        #            output_queue=output_queue,
        #            global_kill_flag=global_kill_flag)

    @staticmethod
    def _run(config: BasePipelineStageConfig,
             input_queues: dict[CameraId, Queue],
             output_queue: Queue,
             all_ready_events: dict[CameraId | str, multiprocessing.Event],
        global_kill_flag: multiprocessing.Event):
        raise NotImplementedError(
            "Add your aggregation process logic here! See example in the `freemocap/.../dummy_pipeline.py` file.")
        # while not global_kill_flag.is_set():
        #     data_by_camera_id = {camera_id: None for camera_id in input_queues.keys()}
        #     while any([input_queues[camera_id].empty() for camera_id in input_queues.keys()]):
        #         time.sleep(0.001)
        #         for camera_id in input_queues.keys():
        #             if not input_queues[camera_id] is None:
        #                 if not input_queues[camera_id].empty():
        #                     data_by_camera_id[camera_id] = input_queues[camera_id].get()
        #     if len(data_by_camera_id) == len(input_queues):
        #         logger.trace(f"Processing aggregated data from cameras {data_by_camera_id.keys()}")
        #         # TODO - process aggregated data
        #         output_queue.put(PipelineData(data=data_by_camera_id))

    def start(self):
        logger.debug(f"Starting {self.__class__.__name__}")
        self.process.start()

    def stop(self):
        logger.debug(f"Stopping {self.__class__.__name__}")
        self.global_kill_flag.set()
        self.process.join()


class PipelineImageAnnotator(BaseModel, ABC):
    camera_node_annotators: dict[CameraId, BaseImageAnnotator]

    @classmethod
    def create(cls, configs: dict[CameraId, BaseImageAnnotatorConfig]):
        raise NotImplementedError(
            "You need to re-implement this method with your pipeline's version of the PipelineImageAnnotator ")

    def annotate_images(self, multiframe_payload: MultiFramePayload, pipeline_output: BasePipelineOutputData) -> MultiFramePayload:
        raise NotImplementedError(
            "You need to re-implement this method with your pipeline's version of the PipelineImageAnnotator ")

from skellycam.core.camera_group.camera_group import CameraGroup


@dataclass
class BaseProcessingPipeline( ABC):
    config: BasePipelineStageConfig
    data_source: CameraGroup #TODO Add: e.g. | VideoGroup | RerunRecording
    camera_nodes: dict[CameraId, BaseCameraNode]
    aggregation_node: BaseAggregationNode
    annotator: PipelineImageAnnotator
    global_kill_flag: multiprocessing.Event
    all_ready_events: dict[CameraId|str, multiprocessing.Event]

    latest_pipeline_data: BasePipelineData | None = None
    started: bool = False

    @property
    def alive(self  ) -> bool:
        return all([camera_node.worker.is_alive() for camera_node in self.camera_nodes.values()]) and self.aggregation_node.process.is_alive()

    @property
    def nodes_ready(self) -> bool:
        return all(value.is_set() for value in self.all_ready_events.values())

    @property
    def ready_to_intake(self) -> bool:
        return self.alive and self.nodes_ready and not self.global_kill_flag.is_set() and self.started

    @classmethod
    def create(cls,
               config: BasePipelineStageConfig,
               camera_shm_dtos: dict[CameraId, CameraSharedMemoryDTO],
               global_kill_flag: multiprocessing.Event,
               ):
        raise NotImplementedError(
            "You need to re-implement this method with your pipeline's version of the CameraGroupProcessingPipeline "
            "and CameraProcessingNode abstract base classes! See example in the `freemocap/.../dummy_pipeline.py` file.")
        # if not all(camera_id in camera_shm_dtos.keys() for camera_id in config.camera_node_configs.keys()):
        #     raise ValueError("Camera IDs provided in config not in camera shared memory DTOS!")
        # camera_output_queues = {camera_id: Queue() for camera_id in camera_shm_dtos.keys()}
        # aggregation_output_queue = Queue()
        # self._annotator = SkellyTrackerTypes.DUMMY.create().annotator # Returns annotator for dummy tracker, NOT the same one that will be created in the camera/nodes, but will be able to process their output
        # camera_nodes = {camera_id: CameraProcessingNode.create(config=config,
        #                                                        camera_id=CameraId(camera_id),
        #                                                        camera_ring_shm_dto=camera_shm_dtos[camera_id],
        #                                                        output_queue=camera_output_queues[camera_id],
        #                                                        read_type=read_type,
        #                                                        global_kill_flag=global_kill_flag)
        #                 for camera_id, config in config.camera_node_configs.items()}
        # aggregation_process = AggregationProcessNode.create(config=config.aggregation_node_config,
        #                                                     input_queues=camera_output_queues,
        #                                                     output_queue=aggregation_output_queue,
        #                                                     global_kill_flag=global_kill_flag)
        #
        # return cls(config=config,
        #            camera_nodes=camera_nodes,
        #            aggregation_node=aggregation_process,
        #            global_kill_flag=global_kill_flag,
        #            )

    async def process_multiframe_payload(self, multiframe_payload: MultiFramePayload, annotate_images: bool = True) -> tuple[MultiFramePayload, BasePipelineOutputData]:
        self.intake_data(multiframe_payload)
        pipeline_output = await self.get_next_data_async()
        if not multiframe_payload.multi_frame_number == pipeline_output.multi_frame_number:
            raise ValueError(f"Frame number mismatch: {multiframe_payload.multi_frame_number} != {pipeline_output.multi_frame_number}")
        annotated_payload = self.annotate_images(multiframe_payload, pipeline_output)
        return annotated_payload, pipeline_output


    def intake_data(self, multiframe_payload: MultiFramePayload):
        if not self.ready_to_intake:
            raise ValueError("Pipeline not ready to intake data!")
        if not all(camera_id in self.camera_nodes.keys() for camera_id in multiframe_payload.camera_ids):
            raise ValueError("Data provided for camera IDs not in camera processes!")
        for camera_id, frame_payload in multiframe_payload.frames.items():
            if not frame_payload.frame_number == multiframe_payload.multi_frame_number:
                raise ValueError(f"Frame number mismatch: {frame_payload.frame_number} != {multiframe_payload.multi_frame_number}")
            self.camera_nodes[camera_id].intake_data(frame_payload)

    def get_next_data(self) -> BasePipelineOutputData | None:
        if self.aggregation_node.output_queue.empty():
            return None
        data = self.aggregation_node.output_queue.get()
        return data

    async def get_next_data_async(self) -> BasePipelineOutputData:
        while self.aggregation_node.output_queue.empty():
            await asyncio.sleep(0.001)
        data = self.aggregation_node.output_queue.get()
        return data

    def get_latest_data(self) -> BasePipelineOutputData | None:
        while not self.aggregation_node.output_queue.empty():
            self.latest_pipeline_data = self.aggregation_node.output_queue.get()

        return self.latest_pipeline_data

    def get_output_for_frame(self, target_frame_number:int) -> BasePipelineOutputData | None:
        while not self.aggregation_node.output_queue.empty():
            self.latest_pipeline_data:BasePipelineOutputData = self.aggregation_node.output_queue.get()
            print(f"Frame Annotator got data for frame {self.latest_pipeline_data.multi_frame_number}")
            if self.latest_pipeline_data.multi_frame_number > target_frame_number:
                raise ValueError(f"We missed the target frame number {target_frame_number} - current output is for frame {self.latest_pipeline_data.multi_frame_number}")

            if self.latest_pipeline_data.multi_frame_number == target_frame_number:
                return self.latest_pipeline_data


    def annotate_images(self, multiframe_payload: MultiFramePayload,
                        pipeline_output:BasePipelineOutputData|None) -> MultiFramePayload:
        if pipeline_output is None:
            return multiframe_payload
        return self.annotator.annotate_images(multiframe_payload, pipeline_output)

    def start(self):
        logger.debug(f"Starting {self.__class__.__name__} with camera processes {list(self.camera_nodes.keys())}...")
        self.aggregation_node.start()
        for camera_id, camera_node in self.camera_nodes.items():
            camera_node.start()
        self.started = True

    def shutdown(self):
        logger.debug(f"Shutting down {self.__class__.__name__}...")
        self.started = False
        self.global_kill_flag.value = True
        self.aggregation_node.stop()
        for camera_id, camera_process in self.camera_nodes.items():
            camera_process.stop()



